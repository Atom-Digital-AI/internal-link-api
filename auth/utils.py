"""Auth utility functions: password hashing, JWT token management."""
import os
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import HTTPException, status
from jose import JWTError, jwt

SPECIAL_CHARS = r"!@#$%^&*()_+-=[]{};\':\"|\,.<>/?"
JWT_SECRET = os.environ.get("JWT_SECRET", "changeme-insecure-default")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7
REFRESH_TOKEN_REMEMBER_ME_DAYS = 30


def validate_password_strength(password: str) -> None:
    """Validate password meets minimum strength requirements.

    Raises ValueError if password is too weak.
    """
    if len(password) < 10:
        raise ValueError("Password must be at least 10 characters long.")
    if not any(c.isalpha() for c in password):
        raise ValueError("Password must contain at least one letter.")
    if not any(c.isdigit() for c in password):
        raise ValueError("Password must contain at least one digit.")
    if not any(c in SPECIAL_CHARS for c in password):
        raise ValueError(
            "Password must contain at least one special character (!@#$%^&*()_+-=[]{};\\':\"|,.<>/?)."
        )


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt with 12 rounds."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str) -> str:
    """Create a short-lived JWT access token (15 minutes)."""
    expires = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "exp": expires,
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str, remember_me: bool = False) -> str:
    """Create a long-lived JWT refresh token (7 days, or 30 days if remember_me)."""
    days = REFRESH_TOKEN_REMEMBER_ME_DAYS if remember_me else REFRESH_TOKEN_EXPIRE_DAYS
    expires = datetime.now(timezone.utc) + timedelta(days=days)
    payload = {
        "sub": user_id,
        "exp": expires,
        "type": "refresh",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token.

    Raises HTTPException 401 if the token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
