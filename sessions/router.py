"""Analysis sessions CRUD router (Pro users only)."""
import uuid
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from billing.dependencies import require_starter_or_pro
from database import get_db
from db_models import AnalysisSession, User

router = APIRouter(prefix="/sessions", tags=["sessions"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class SessionCreateRequest(BaseModel):
    domain: Optional[str] = None
    config: Optional[Any] = None
    results: Optional[Any] = None
    is_saved: bool = False


class SessionUpdateRequest(BaseModel):
    config: Optional[Any] = None
    results: Optional[Any] = None
    is_saved: Optional[bool] = None


class SessionListItem(BaseModel):
    id: str
    domain: Optional[str]
    is_saved: bool
    source_pattern: Optional[str] = None
    target_pattern: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    url_count: int = 0


class SessionDetail(BaseModel):
    id: str
    domain: Optional[str]
    is_saved: bool
    config: Optional[Any]
    results: Optional[Any]
    created_at: datetime
    updated_at: datetime


def _url_count_from_results(results: Any) -> int:
    """Extract URL count from session results."""
    if isinstance(results, dict):
        r = results.get("results", [])
        if isinstance(r, list):
            return len(r)
    if isinstance(results, list):
        return len(results)
    return 0


def _session_to_list_item(session: AnalysisSession) -> SessionListItem:
    source_pattern = None
    target_pattern = None
    if isinstance(session.config, dict):
        source_pattern = session.config.get("sourcePattern")
        target_pattern = session.config.get("targetPattern")
    return SessionListItem(
        id=str(session.id),
        domain=session.domain,
        is_saved=session.is_saved,
        source_pattern=source_pattern,
        target_pattern=target_pattern,
        created_at=session.created_at,
        updated_at=session.updated_at,
        url_count=_url_count_from_results(session.results),
    )


def _session_to_detail(session: AnalysisSession) -> SessionDetail:
    return SessionDetail(
        id=str(session.id),
        domain=session.domain,
        is_saved=session.is_saved,
        config=session.config,
        results=session.results,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


# ---------------------------------------------------------------------------
# GET /sessions
# ---------------------------------------------------------------------------


@router.get("", response_model=list[SessionListItem])
async def list_sessions(
    current_user: User = Depends(require_starter_or_pro),
    db: AsyncSession = Depends(get_db),
) -> list[SessionListItem]:
    result = await db.execute(
        select(AnalysisSession)
        .where(AnalysisSession.user_id == current_user.id)
        .order_by(AnalysisSession.updated_at.desc())
    )
    sessions = result.scalars().all()
    return [_session_to_list_item(s) for s in sessions]


# ---------------------------------------------------------------------------
# POST /sessions
# ---------------------------------------------------------------------------


@router.post("", response_model=SessionDetail, status_code=status.HTTP_201_CREATED)
async def create_session(
    request_body: SessionCreateRequest,
    current_user: User = Depends(require_starter_or_pro),
    db: AsyncSession = Depends(get_db),
) -> SessionDetail:
    session = AnalysisSession(
        user_id=current_user.id,
        domain=request_body.domain,
        config=request_body.config,
        results=request_body.results,
        is_saved=request_body.is_saved,
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return _session_to_detail(session)


# ---------------------------------------------------------------------------
# GET /sessions/{session_id}
# ---------------------------------------------------------------------------


@router.get("/{session_id}", response_model=SessionDetail)
async def get_session(
    session_id: str,
    current_user: User = Depends(require_starter_or_pro),
    db: AsyncSession = Depends(get_db),
) -> SessionDetail:
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    result = await db.execute(
        select(AnalysisSession).where(
            AnalysisSession.id == sid,
            AnalysisSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
    return _session_to_detail(session)


# ---------------------------------------------------------------------------
# PUT /sessions/{session_id}
# ---------------------------------------------------------------------------


@router.put("/{session_id}", response_model=SessionDetail)
async def update_session(
    session_id: str,
    request_body: SessionUpdateRequest,
    current_user: User = Depends(require_starter_or_pro),
    db: AsyncSession = Depends(get_db),
) -> SessionDetail:
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    result = await db.execute(
        select(AnalysisSession).where(
            AnalysisSession.id == sid,
            AnalysisSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    if request_body.config is not None:
        session.config = request_body.config
    if request_body.results is not None:
        session.results = request_body.results
    if request_body.is_saved is not None:
        session.is_saved = request_body.is_saved

    session.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(session)
    return _session_to_detail(session)


# ---------------------------------------------------------------------------
# DELETE /sessions/{session_id}
# ---------------------------------------------------------------------------


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    current_user: User = Depends(require_starter_or_pro),
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    result = await db.execute(
        select(AnalysisSession).where(
            AnalysisSession.id == sid,
            AnalysisSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    await db.delete(session)
    await db.flush()
