"""Plan enforcement dependencies for FastAPI routes."""
from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.dependencies import get_current_user
from database import get_db
from db_models import AiUsage, User


async def require_pro(current_user: User = Depends(get_current_user)) -> User:
    """Require the user to have an active Pro subscription.

    Raises HTTPException 403 if user is on the Free plan.
    """
    if current_user.plan != "pro":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature requires a Pro subscription. Upgrade at /pricing",
        )
    return current_user


def check_bulk_url_limit(url_count: int, user: User) -> None:
    """Check if the user is within their plan's URL limit.

    Raises HTTPException 403 if a Free user tries to scan more than 10 URLs.
    """
    if user.plan == "free" and url_count > 10:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Free plan supports up to 10 URLs. Upgrade to Pro for up to 500 URLs",
        )


async def check_ai_usage(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Check if user has remaining AI calls this period.

    Raises HTTPException 429 if the user has reached their monthly limit (200 calls).
    """
    result = await db.execute(select(AiUsage).where(AiUsage.user_id == user.id))
    ai_usage = result.scalar_one_or_none()

    if ai_usage is not None and ai_usage.call_count >= 200:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Monthly AI limit of 200 calls reached",
        )

    return user
