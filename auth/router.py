"""Auth router: register, login, logout, token refresh, password reset, user profile."""
import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.utils import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    validate_password_strength,
    verify_password,
)
from database import get_db
from db_models import User

router = APIRouter(prefix="/auth", tags=["auth"])
user_router = APIRouter(prefix="/user", tags=["user"])

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")


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


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserMeResponse(BaseModel):
    id: str
    email: str
    plan: str
    created_at: datetime


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


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
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
# POST /auth/login (rate limited: 10/15min per IP - applied in main.py)
# ---------------------------------------------------------------------------


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

    if user is None or not verify_password(request_body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=_INVALID_MSG
        )

    user_id = str(user.id)
    access_token = create_access_token(user_id)
    refresh_tok = create_refresh_token(user_id, remember_me=request_body.remember_me)
    _set_refresh_cookie(response, refresh_tok, remember_me=request_body.remember_me)

    return TokenResponse(access_token=access_token)


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


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
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
        except Exception:
            pass  # Email failures must not break the flow

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
    current_user: User = Depends(lambda: None),
) -> UserMeResponse:
    """Get current authenticated user profile (requires Bearer token).

    The real dependency (get_current_user from auth.dependencies) is injected
    by main.py via app.dependency_overrides to avoid circular imports.
    """
    return UserMeResponse(
        id=str(current_user.id),
        email=current_user.email,
        plan=current_user.plan,
        created_at=current_user.created_at,
    )
