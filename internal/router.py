"""Internal maintenance endpoints, protected by a shared secret header."""
import logging
import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from db_models import AnalysisSession, SavedLink, User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/internal", tags=["internal"])

INTERNAL_SECRET = os.environ.get("INTERNAL_SECRET", "")
if not INTERNAL_SECRET:
    logging.getLogger(__name__).warning(
        "INTERNAL_SECRET not set — /internal/* endpoints will reject all requests"
    )


def _verify_secret(x_internal_secret: str = Header(default="")) -> None:
    if not INTERNAL_SECRET or x_internal_secret != INTERNAL_SECRET:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@router.post("/cleanup-sessions", dependencies=[Depends(_verify_secret)])
async def cleanup_downgraded_sessions(db: AsyncSession = Depends(get_db)) -> dict:
    """Delete sessions and saved links for users downgraded more than 30 days ago."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)

    result = await db.execute(
        select(User).where(User.downgraded_at.isnot(None), User.downgraded_at < cutoff)
    )
    users = result.scalars().all()

    deleted_sessions = 0
    deleted_links = 0

    for user in users:
        # Delete saved links
        link_result = await db.execute(
            delete(SavedLink).where(SavedLink.user_id == user.id)
        )
        deleted_links += link_result.rowcount

        # Delete analysis sessions
        session_result = await db.execute(
            delete(AnalysisSession).where(AnalysisSession.user_id == user.id)
        )
        deleted_sessions += session_result.rowcount

        # Clear the downgraded_at so it doesn't re-trigger
        user.downgraded_at = None

    await db.flush()
    logger.info("Cleanup: deleted %d sessions and %d links for %d users", deleted_sessions, deleted_links, len(users))
    return {"users_cleaned": len(users), "sessions_deleted": deleted_sessions, "links_deleted": deleted_links}
