"""Cloudflare Turnstile server-side verification."""
import logging
import os

import httpx

logger = logging.getLogger(__name__)

TURNSTILE_SECRET_KEY = os.environ.get("TURNSTILE_SECRET_KEY", "")
TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


async def verify_turnstile(token: str, ip: str | None = None) -> bool:
    """Verify a Turnstile token with Cloudflare.

    Returns True if verification succeeds or if no secret key is configured
    (graceful degradation for local dev).
    """
    if not TURNSTILE_SECRET_KEY:
        logger.warning("TURNSTILE_SECRET_KEY not set — skipping Turnstile verification")
        return True

    payload: dict[str, str] = {
        "secret": TURNSTILE_SECRET_KEY,
        "response": token,
    }
    if ip:
        payload["remoteip"] = ip

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(TURNSTILE_VERIFY_URL, data=payload)
            resp.raise_for_status()
            result = resp.json()
            return result.get("success", False)
    except Exception:
        logger.exception("Turnstile verification request failed")
        return False
