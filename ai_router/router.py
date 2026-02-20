"""AI suggest router: AI service proxy with usage tracking (Pro users only)."""
import logging
import os
from calendar import monthrange
from datetime import datetime, timezone

import sentry_sdk

from fastapi import APIRouter, Depends, HTTPException, Response, status
from google import genai
from google.genai import types
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from billing.dependencies import require_starter_or_pro
from database import get_db
from db_models import AiUsage, User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ["GEMINI_MODEL"]
AI_MONTHLY_LIMITS = {"starter": 30, "pro": 200}


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class AiSuggestRequest(BaseModel):
    source_url: str
    source_content: str
    target_url: str
    target_title: str
    target_keywords: list[str]


class AiSuggestResponse(BaseModel):
    suggestion: str
    reasoning: str


# ---------------------------------------------------------------------------
# Helper: get or create ai_usage row for current billing period
# ---------------------------------------------------------------------------


async def _get_or_create_ai_usage(user: User, db: AsyncSession) -> AiUsage:
    result = await db.execute(select(AiUsage).where(AiUsage.user_id == user.id))
    ai_usage = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    year, month = now.year, now.month
    _, last_day = monthrange(year, month)
    period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    period_end = now.replace(day=last_day, hour=23, minute=59, second=59, microsecond=0)

    if ai_usage is None:
        ai_usage = AiUsage(
            user_id=user.id,
            call_count=0,
            period_start=period_start,
            period_end=period_end,
        )
        db.add(ai_usage)
        await db.flush()
    elif ai_usage.period_end and ai_usage.period_end < now:
        # New billing period - reset counter
        ai_usage.call_count = 0
        ai_usage.period_start = period_start
        ai_usage.period_end = period_end
        await db.flush()

    return ai_usage


# ---------------------------------------------------------------------------
# POST /ai/suggest
# ---------------------------------------------------------------------------


@router.post("/suggest", response_model=AiSuggestResponse)
async def ai_suggest(
    request_body: AiSuggestRequest,
    response: Response,
    current_user: User = Depends(require_starter_or_pro),
    db: AsyncSession = Depends(get_db),
) -> AiSuggestResponse:
    ai_usage = await _get_or_create_ai_usage(current_user, db)
    monthly_limit = AI_MONTHLY_LIMITS.get(current_user.plan, 30)

    if ai_usage.call_count >= monthly_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Monthly AI limit of {monthly_limit} calls reached",
        )

    # Build prompt
    keywords_str = ", ".join(request_body.target_keywords) if request_body.target_keywords else "none"
    prompt = f"""You are an SEO expert helping to find internal linking opportunities.

Source page URL: {request_body.source_url}
Source page content (excerpt):
{request_body.source_content[:2000]}

Target page URL: {request_body.target_url}
Target page title: {request_body.target_title}
Target page keywords: {keywords_str}

Analyze the source content and suggest:
1. The best anchor text to use for a link from the source page to the target page
2. Brief reasoning for why this internal link would benefit SEO and users

Respond in this exact JSON format:
{{"suggestion": "anchor text here", "reasoning": "your reasoning here"}}"""

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        gemini_response = await client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        raw_text = gemini_response.text or ""

        import json

        parsed = json.loads(raw_text)
        suggestion = parsed.get("suggestion", "")
        reasoning = parsed.get("reasoning", "")
    except Exception as e:
        logger.error("AI service error for user %s: %s", current_user.id, e)
        sentry_sdk.capture_exception(e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(e)}",
        )

    # Increment usage counter
    ai_usage.call_count += 1
    await db.flush()

    remaining = max(0, monthly_limit - ai_usage.call_count)
    response.headers["X-AI-Calls-Remaining"] = str(remaining)

    return AiSuggestResponse(suggestion=suggestion, reasoning=reasoning)
