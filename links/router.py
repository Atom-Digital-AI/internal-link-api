"""Saved links CRUD router (Pro users only)."""
import uuid
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from billing.dependencies import require_pro
from database import get_db
from db_models import SavedLink, User

router = APIRouter(prefix="/saved-links", tags=["saved-links"])


# ---------------------------------------------------------------------------
#  Schemas
# ---------------------------------------------------------------------------


class SavedLinkCreateRequest(BaseModel):
    link_data: Any
    session_id: Optional[uuid.UUID] = None


class SavedLinkItem(BaseModel):
    id: str
    link_data: Any
    session_id: Optional[str]
    created_at: datetime


class BulkDeleteRequest(BaseModel):
    ids: list[uuid.UUID]


def _to_item(link: SavedLink) -> SavedLinkItem:
    return SavedLinkItem(
        id=str(link.id),
        link_data=link.link_data,
        session_id=str(link.session_id) if link.session_id else None,
        created_at=link.created_at,
    )


# ---------------------------------------------------------------------------
# GET /saved-links
# ---------------------------------------------------------------------------


@router.get("", response_model=list[SavedLinkItem])
async def list_saved_links(
    current_user: User = Depends(require_pro),
    db: AsyncSession = Depends(get_db),
) -> list[SavedLinkItem]:
    result = await db.execute(
        select(SavedLink)
        .where(SavedLink.user_id == current_user.id)
        .order_by(SavedLink.created_at.desc())
    )
    links = result.scalars().all()
    return [_to_item(link) for link in links]


# ---------------------------------------------------------------------------
# POST /saved-links
# ---------------------------------------------------------------------------


@router.post("", response_model=SavedLinkItem, status_code=status.HTTP_201_CREATED)
async def create_saved_link(
    request_body: SavedLinkCreateRequest,
    current_user: User = Depends(require_pro),
    db: AsyncSession = Depends(get_db),
) -> SavedLinkItem:
    link = SavedLink(
        user_id=current_user.id,
        session_id=request_body.session_id,
        link_data=request_body.link_data,
    )
    db.add(link)
    await db.flush()
    await db.refresh(link)
    return _to_item(link)


# ---------------------------------------------------------------------------
# DELETE /saved-links/{link_id}
# ---------------------------------------------------------------------------


@router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_link(
    link_id: str,
    current_user: User = Depends(require_pro),
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        lid = uuid.UUID(link_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found.")

    result = await db.execute(
        select(SavedLink).where(
            SavedLink.id == lid,
            SavedLink.user_id == current_user.id,
        )
    )
    link = result.scalar_one_or_none()
    if link is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found.")

    await db.delete(link)
    await db.flush()


# ---------------------------------------------------------------------------
# DELETE /saved-links (bulk delete)
# ---------------------------------------------------------------------------


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def bulk_delete_saved_links(
    request_body: BulkDeleteRequest,
    current_user: User = Depends(require_pro),
    db: AsyncSession = Depends(get_db),
) -> None:
    await db.execute(
        delete(SavedLink).where(
            SavedLink.id.in_(request_body.ids),
            SavedLink.user_id == current_user.id,
        )
    )
    await db.flush()
