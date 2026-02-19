"""Billing router: Stripe checkout, customer portal, and webhook handler."""
import logging
import os
from datetime import datetime, timezone

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from database import get_db
from db_models import AiUsage, Subscription, User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["billing"])

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_STARTER_MONTHLY_PRICE_ID = os.environ.get("STRIPE_STARTER_MONTHLY_PRICE_ID", "")
STRIPE_PRO_MONTHLY_PRICE_ID = os.environ.get("STRIPE_PRO_MONTHLY_PRICE_ID", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")


def _stripe():
    """Get configured Stripe client."""
    stripe.api_key = STRIPE_SECRET_KEY
    return stripe


# ---------------------------------------------------------------------------
# POST /billing/checkout
# ---------------------------------------------------------------------------


class CheckoutRequest(BaseModel):
    plan: str = "pro"   # "starter" | "pro"


class CheckoutResponse(BaseModel):
    url: str


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    request_body: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CheckoutResponse:
    if request_body.plan not in ("starter", "pro"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="plan must be 'starter' or 'pro'.",
        )
    _stripe()
    if request_body.plan == "starter":
        price_id = STRIPE_STARTER_MONTHLY_PRICE_ID
    else:
        price_id = STRIPE_PRO_MONTHLY_PRICE_ID

    # Find or create Stripe customer
    stripe_customer_id = None
    sub_result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id)
    )
    existing_sub = sub_result.scalars().first()
    if existing_sub and existing_sub.stripe_customer_id:
        stripe_customer_id = existing_sub.stripe_customer_id

    if not stripe_customer_id:
        customer = stripe.Customer.create(email=current_user.email)
        stripe_customer_id = customer.id

    checkout_session = stripe.checkout.Session.create(
        customer=stripe_customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=f"{FRONTEND_URL}/account?success=true",
        cancel_url=f"{FRONTEND_URL}/pricing",
        metadata={"user_id": str(current_user.id), "plan": request_body.plan},
    )

    return CheckoutResponse(url=checkout_session.url)


# ---------------------------------------------------------------------------
# GET /billing/portal
# ---------------------------------------------------------------------------


class PortalResponse(BaseModel):
    url: str


@router.get("/portal", response_model=PortalResponse)
async def get_billing_portal(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PortalResponse:
    _stripe()

    sub_result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id)
    )
    subscription = sub_result.scalars().first()

    if not subscription or not subscription.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Stripe customer found for this account.",
        )

    portal_session = stripe.billing_portal.Session.create(
        customer=subscription.stripe_customer_id,
        return_url=f"{FRONTEND_URL}/account",
    )

    return PortalResponse(url=portal_session.url)


# ---------------------------------------------------------------------------
# POST /billing/cancel
# ---------------------------------------------------------------------------


class CancelResponse(BaseModel):
    current_period_end: datetime | None


@router.post("/cancel", response_model=CancelResponse)
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CancelResponse:
    """Cancel the subscription at period end. User keeps Pro access until current_period_end."""
    _stripe()

    sub_result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id)
    )
    subscription = sub_result.scalars().first()

    if not subscription or not subscription.stripe_subscription_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active subscription found.",
        )

    if subscription.status not in ("active",):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subscription is not active.",
        )

    try:
        stripe_sub = stripe.Subscription.modify(
            subscription.stripe_subscription_id,
            cancel_at_period_end=True,
        )
        current_period_end_ts = stripe_sub.get("current_period_end")
        current_period_end = (
            datetime.fromtimestamp(current_period_end_ts, tz=timezone.utc)
            if current_period_end_ts
            else None
        )
    except Exception as e:
        logger.error("Stripe cancel error for user %s: %s", current_user.id, e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to cancel subscription: {str(e)}",
        )

    subscription.status = "pending_cancellation"
    subscription.current_period_end = current_period_end
    await db.flush()

    return CancelResponse(current_period_end=current_period_end)


# ---------------------------------------------------------------------------
# POST /billing/upgrade  (Starter → Pro)
# ---------------------------------------------------------------------------


class UpgradeResponse(BaseModel):
    plan: str


@router.post("/upgrade", response_model=UpgradeResponse)
async def upgrade_to_pro(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UpgradeResponse:
    """Upgrade a Starter subscriber to Pro using Stripe proration."""
    if current_user.plan != "starter":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Starter subscribers can upgrade via this endpoint.",
        )

    _stripe()

    sub_result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id)
    )
    subscription = sub_result.scalars().first()

    if not subscription or not subscription.stripe_subscription_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active Starter subscription found.",
        )

    if subscription.status not in ("active",):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subscription is not active.",
        )

    try:
        stripe_sub = stripe.Subscription.retrieve(subscription.stripe_subscription_id)
        item_id = stripe_sub["items"]["data"][0]["id"]
        stripe.Subscription.modify(
            subscription.stripe_subscription_id,
            items=[{"id": item_id, "price": STRIPE_PRO_MONTHLY_PRICE_ID}],
            proration_behavior="always_invoice",
        )
    except Exception as e:
        logger.error("Stripe upgrade error for user %s: %s", current_user.id, e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to upgrade subscription: {str(e)}",
        )

    current_user.plan = "pro"
    await db.flush()

    return UpgradeResponse(plan="pro")


# ---------------------------------------------------------------------------
# POST /billing/webhook
# ---------------------------------------------------------------------------


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except stripe.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Stripe webhook signature.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Webhook error: {str(e)}",
        )

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        await _handle_checkout_completed(data, db)
    elif event_type == "customer.subscription.updated":
        await _handle_subscription_updated(data, db)
    elif event_type == "customer.subscription.deleted":
        await _handle_subscription_deleted(data, db)
    elif event_type == "invoice.payment_failed":
        await _handle_payment_failed(data, db)
    # All other events acknowledged but ignored

    return {"received": True}


async def _handle_checkout_completed(data: dict, db: AsyncSession) -> None:
    customer_email = data.get("customer_email") or ""
    stripe_customer_id = data.get("customer", "")
    stripe_subscription_id = data.get("subscription", "")
    metadata = data.get("metadata", {})
    user_id_meta = metadata.get("user_id")
    plan_meta = metadata.get("plan", "pro")

    # Find user by metadata user_id or email
    user = None
    if user_id_meta:
        result = await db.execute(select(User).where(User.id == user_id_meta))
        user = result.scalar_one_or_none()

    if user is None and customer_email:
        result = await db.execute(select(User).where(User.email == customer_email))
        user = result.scalar_one_or_none()

    if user is None:
        logger.warning("checkout.session.completed: user not found for customer %s", stripe_customer_id)
        return

    # Fetch subscription details from Stripe to get period end
    current_period_end = None
    if stripe_subscription_id:
        try:
            stripe_sub = stripe.Subscription.retrieve(stripe_subscription_id)
            ts = stripe_sub.get("current_period_end")
            if ts:
                current_period_end = datetime.fromtimestamp(ts, tz=timezone.utc)
        except Exception as e:
            logger.warning("Could not retrieve subscription %s: %s", stripe_subscription_id, e)

    # Upsert subscription
    sub_result = await db.execute(
        select(Subscription).where(Subscription.user_id == user.id)
    )
    subscription = sub_result.scalars().first()

    if subscription:
        subscription.stripe_customer_id = stripe_customer_id
        subscription.stripe_subscription_id = stripe_subscription_id
        subscription.status = "active"
        subscription.current_period_end = current_period_end
    else:
        subscription = Subscription(
            user_id=user.id,
            stripe_customer_id=stripe_customer_id,
            stripe_subscription_id=stripe_subscription_id,
            status="active",
            current_period_end=current_period_end,
        )
        db.add(subscription)

    # Determine plan from metadata; fall back to price ID comparison if needed
    new_plan = "starter" if plan_meta == "starter" else "pro"
    user.plan = new_plan
    await db.flush()

    # Send confirmation email
    try:
        from email_service import send_subscription_confirmation_email

        renewal_str = current_period_end.strftime("%B %d, %Y") if current_period_end else "N/A"
        send_subscription_confirmation_email(user.email, new_plan, renewal_str)
    except Exception as e:
        logger.error("Failed to send subscription confirmation email: %s", e)


async def _handle_subscription_updated(data: dict, db: AsyncSession) -> None:
    stripe_subscription_id = data.get("id", "")
    status_val = data.get("status", "")
    current_period_end_ts = data.get("current_period_end")

    current_period_end = None
    if current_period_end_ts:
        current_period_end = datetime.fromtimestamp(current_period_end_ts, tz=timezone.utc)

    sub_result = await db.execute(
        select(Subscription).where(
            Subscription.stripe_subscription_id == stripe_subscription_id
        )
    )
    subscription = sub_result.scalars().first()
    if subscription:
        subscription.status = status_val
        subscription.current_period_end = current_period_end
        await db.flush()


async def _handle_subscription_deleted(data: dict, db: AsyncSession) -> None:
    stripe_subscription_id = data.get("id", "")
    current_period_end_ts = data.get("current_period_end")

    current_period_end = None
    if current_period_end_ts:
        current_period_end = datetime.fromtimestamp(current_period_end_ts, tz=timezone.utc)

    sub_result = await db.execute(
        select(Subscription).where(
            Subscription.stripe_subscription_id == stripe_subscription_id
        )
    )
    subscription = sub_result.scalars().first()
    if not subscription:
        return

    subscription.status = "canceled"
    subscription.current_period_end = current_period_end

    # Downgrade to free if period has ended
    now = datetime.now(timezone.utc)
    user_result = await db.execute(select(User).where(User.id == subscription.user_id))
    user = user_result.scalar_one_or_none()

    access_until_str = "now"
    if current_period_end:
        access_until_str = current_period_end.strftime("%B %d, %Y")
        if current_period_end < now:
            if user:
                user.plan = "free"
                user.downgraded_at = datetime.now(timezone.utc)
    else:
        if user:
            user.plan = "free"
            user.downgraded_at = datetime.now(timezone.utc)

    await db.flush()

    # Send cancellation email
    if user:
        try:
            from email_service import send_cancellation_email

            send_cancellation_email(user.email, access_until_str)
        except Exception as e:
            logger.error("Failed to send cancellation email: %s", e)


async def _handle_payment_failed(data: dict, db: AsyncSession) -> None:
    stripe_subscription_id = data.get("subscription", "")
    if not stripe_subscription_id:
        return

    sub_result = await db.execute(
        select(Subscription).where(
            Subscription.stripe_subscription_id == stripe_subscription_id
        )
    )
    subscription = sub_result.scalars().first()
    if subscription:
        subscription.status = "past_due"
        await db.flush()
