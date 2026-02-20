"""Auth router: register, login, logout, token refresh, password reset, user profile."""
import hashlib
import logging
import os
import secrets

import sentry_sdk
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from auth.disposable_email import is_disposable_email

from rate_limit import limiter
from auth.dependencies import get_current_user as get_current_user_dep
from auth.utils import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    validate_password_strength,
    verify_password,
)
from database import get_db
from db_models import AiUsage, Subscription, User

router = APIRouter(prefix="/auth", tags=["auth"])
user_router = APIRouter(prefix="/user", tags=["user"])

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------------------------------


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False


class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token from frontend


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserMeResponse(BaseModel):
    id: str
    email: str
    plan: str
    created_at: datetime
    has_google: bool = False
    has_password: bool = True


# ---------------------------------------------------------------------------
# Helper to set httpOnly refresh cookie
# ---------------------------------------------------------------------------


def _set_refresh_cookie(response: Response, token: str, remember_me: bool = False) -> None:
    max_age = 30 * 24 * 3600 if remember_me else 7 * 24 * 3600
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=max_age,
        path="/auth/refresh",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key="refresh_token", path="/auth/refresh")


# ---------------------------------------------------------------------------
# POST /auth/register
# ---------------------------------------------------------------------------


@limiter.limit("5/minute")
@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    request_body: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    if request_body.password != request_body.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match."
        )

    try:
        validate_password_strength(request_body.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if is_disposable_email(request_body.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration with disposable email addresses is not allowed.",
        )

    existing = await db.execute(select(User).where(User.email == request_body.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        email=request_body.email,
        password_hash=hash_password(request_body.password),
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    user_id = str(user.id)
    access_token = create_access_token(user_id)
    refresh_tok = create_refresh_token(user_id)
    _set_refresh_cookie(response, refresh_tok)

    return TokenResponse(access_token=access_token)


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------


@limiter.limit("5/minute")
@router.post("/login", response_model=TokenResponse)
async def login(
    request_body: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    _INVALID_MSG = "Invalid email or password."

    result = await db.execute(select(User).where(User.email == request_body.email))
    user = result.scalar_one_or_none()

    if user is None or not user.password_hash or not verify_password(request_body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=_INVALID_MSG
        )

    user_id = str(user.id)
    access_token = create_access_token(user_id)
    refresh_tok = create_refresh_token(user_id, remember_me=request_body.remember_me)
    _set_refresh_cookie(response, refresh_tok, remember_me=request_body.remember_me)

    return TokenResponse(access_token=access_token)


# ---------------------------------------------------------------------------
# POST /auth/google
# ---------------------------------------------------------------------------


@limiter.limit("10/minute")
@router.post("/google", response_model=TokenResponse)
async def google_auth(
    request: Request,
    request_body: GoogleAuthRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate or register via Google Sign-In."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Sign-In is not configured.",
        )

    try:
        idinfo = google_id_token.verify_oauth2_token(
            request_body.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token.",
        )
    except Exception as e:
        logger.exception("Google token verification failed")
        sentry_sdk.capture_exception(e)
        raise

    google_id = idinfo["sub"]
    email = idinfo.get("email", "").lower()

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account has no email address.",
        )

    # 1. Check if user exists by google_id
    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if user is None:
        # 2. Check if user exists by email (link accounts)
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user is not None:
            # Link Google account to existing email user
            user.google_id = google_id
            await db.flush()
        else:
            # 3. Create new user (Google-only, no password)
            if is_disposable_email(email):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Registration with disposable email addresses is not allowed.",
                )
            user = User(email=email, google_id=google_id)
            db.add(user)
            await db.flush()
            await db.refresh(user)

    user_id = str(user.id)
    access_token = create_access_token(user_id)
    refresh_tok = create_refresh_token(user_id)
    _set_refresh_cookie(response, refresh_tok)

    return TokenResponse(access_token=access_token)


# ---------------------------------------------------------------------------
# POST /auth/google/link — link Google account to authenticated user
# ---------------------------------------------------------------------------


@router.post("/google/link", status_code=status.HTTP_200_OK)
async def link_google(
    request_body: GoogleAuthRequest,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Link a Google account to the current authenticated user."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Sign-In is not configured.",
        )

    if current_user.google_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A Google account is already linked.",
        )

    try:
        idinfo = google_id_token.verify_oauth2_token(
            request_body.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token.",
        )

    google_id = idinfo["sub"]

    # Check if this Google account is already linked to another user
    result = await db.execute(select(User).where(User.google_id == google_id))
    existing = result.scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This Google account is already linked to another user.",
        )

    current_user.google_id = google_id
    await db.flush()

    return {"message": "Google account linked successfully."}


# ---------------------------------------------------------------------------
# POST /auth/logout
# ---------------------------------------------------------------------------


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response) -> dict:
    _clear_refresh_cookie(response)
    return {"message": "Logged out successfully."}


# ---------------------------------------------------------------------------
# POST /auth/refresh
# ---------------------------------------------------------------------------


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias="refresh_token"),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token found.",
        )

    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type.",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )

    new_access_token = create_access_token(user_id)
    return TokenResponse(access_token=new_access_token)


# ---------------------------------------------------------------------------
# POST /auth/forgot-password
# ---------------------------------------------------------------------------


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


@limiter.limit("3/minute")
@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    request: Request,
    request_body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(User).where(User.email == request_body.email))
    user = result.scalar_one_or_none()

    if user is not None:
        raw_token = secrets.token_hex(32)
        hashed_token = hashlib.sha256(raw_token.encode()).hexdigest()
        expiry = datetime.now(timezone.utc) + timedelta(hours=1)

        user.reset_token = hashed_token
        user.reset_token_expires = expiry
        await db.flush()

        try:
            from email_service import send_password_reset_email

            send_password_reset_email(user.email, raw_token)
        except Exception as e:
            sentry_sdk.capture_exception(e)

    return {"message": "If that email exists, a reset link has been sent."}


# ---------------------------------------------------------------------------
# POST /auth/reset-password
# ---------------------------------------------------------------------------


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    request_body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    if request_body.new_password != request_body.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match."
        )

    try:
        validate_password_strength(request_body.new_password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    hashed_token = hashlib.sha256(request_body.token.encode()).hexdigest()
    now = datetime.now(timezone.utc)

    result = await db.execute(select(User).where(User.reset_token == hashed_token))
    user = result.scalar_one_or_none()

    if user is None or user.reset_token_expires is None or user.reset_token_expires < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset link is invalid or has expired.",
        )

    user.password_hash = hash_password(request_body.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    await db.flush()

    return {"message": "Password reset successfully."}


# ---------------------------------------------------------------------------
# GET /user/me
# ---------------------------------------------------------------------------


@user_router.get("/me", response_model=UserMeResponse)
async def get_me(
    current_user: User = Depends(get_current_user_dep),
) -> UserMeResponse:
    """Get current authenticated user profile (requires Bearer token)."""
    return UserMeResponse(
        id=str(current_user.id),
        email=current_user.email,
        plan=current_user.plan,
        created_at=current_user.created_at,
        has_google=current_user.google_id is not None,
        has_password=current_user.password_hash is not None,
    )


# ---------------------------------------------------------------------------
# GET /user/me/subscription
# ---------------------------------------------------------------------------


class SubscriptionResponse(BaseModel):
    has_subscription: bool
    status: Optional[str] = None
    current_period_end: Optional[datetime] = None
    stripe_subscription_id: Optional[str] = None


@user_router.get("/me/subscription", response_model=SubscriptionResponse)
async def get_my_subscription(
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
) -> SubscriptionResponse:
    """Get the current user's subscription details."""
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id)
    )
    subscription = result.scalars().first()

    if subscription is None:
        return SubscriptionResponse(has_subscription=False)

    return SubscriptionResponse(
        has_subscription=True,
        status=subscription.status,
        current_period_end=subscription.current_period_end,
        stripe_subscription_id=subscription.stripe_subscription_id,
    )


# ---------------------------------------------------------------------------
# GET /user/me/usage
# ---------------------------------------------------------------------------


class UsageResponse(BaseModel):
    call_count: int
    period_end: Optional[datetime] = None
    limit: int


@user_router.get("/me/usage", response_model=UsageResponse)
async def get_my_usage(
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
) -> UsageResponse:
    """Get the current user's AI usage for the current billing period."""
    result = await db.execute(select(AiUsage).where(AiUsage.user_id == current_user.id))
    ai_usage = result.scalar_one_or_none()

    ai_limits = {"starter": 30, "pro": 200}
    plan_limit = ai_limits.get(current_user.plan, 0)

    if ai_usage is None:
        return UsageResponse(call_count=0, period_end=None, limit=plan_limit)

    return UsageResponse(
        call_count=ai_usage.call_count,
        period_end=ai_usage.period_end,
        limit=plan_limit,
    )


# ---------------------------------------------------------------------------
# PATCH /user/me — update email
# ---------------------------------------------------------------------------


class UpdateEmailRequest(BaseModel):
    new_email: EmailStr
    current_password: str  # Required to confirm identity before changing email


@user_router.patch("/me", response_model=UserMeResponse)
async def update_email(
    request_body: UpdateEmailRequest,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
) -> UserMeResponse:
    """Update the authenticated user's email address.

    Requires current password verification to prevent account takeover
    if a session token is somehow compromised.
    """
    if current_user.password_hash and not verify_password(request_body.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect.",
        )

    new_email = str(request_body.new_email).lower()

    if is_disposable_email(new_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Disposable email addresses are not allowed.",
        )

    if new_email == current_user.email.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New email is the same as your current email.",
        )

    # Check no other account already uses this email
    existing = await db.execute(select(User).where(User.email == new_email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    current_user.email = new_email
    await db.flush()
    await db.refresh(current_user)

    return UserMeResponse(
        id=str(current_user.id),
        email=current_user.email,
        plan=current_user.plan,
        created_at=current_user.created_at,
        has_google=current_user.google_id is not None,
        has_password=current_user.password_hash is not None,
    )


# ---------------------------------------------------------------------------
# POST /user/change-password
# ---------------------------------------------------------------------------


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


@user_router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    request_body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user_dep),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Change the authenticated user's password.

    Requires the current password to prevent unauthorised password changes
    in the event of a stolen session token.
    """
    if request_body.new_password != request_body.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match.",
        )

    if current_user.password_hash and not verify_password(request_body.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect.",
        )

    if request_body.current_password == request_body.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from your current password.",
        )

    try:
        validate_password_strength(request_body.new_password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    current_user.password_hash = hash_password(request_body.new_password)
    await db.flush()

    return {"message": "Password changed successfully."}
