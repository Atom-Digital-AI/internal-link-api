# Cloudflare Turnstile on Login + Register

## Problem

The auth endpoints (login, register) only have IP-based rate limiting via slowapi. There is no bot detection or CAPTCHA. Credential stuffing and automated registration are possible within rate limits.

## Decision

Add Cloudflare Turnstile (managed mode) to the Login and Register forms with server-side verification.

- **Approach chosen**: Frontend widget + backend siteverify call
- **Rejected**: Frontend-only (no real security), Cloudflare Worker middleware (overkill for 2 forms)

## Scope

- Login page (`frontend/src/pages/Login.tsx`)
- Register page (`frontend/src/pages/Register.tsx`)
- Auth context (`frontend/src/contexts/AuthContext.tsx`)
- Auth router (`auth/router.py`)
- **Not** Google OAuth (Google has its own bot protection)
- **Not** forgot-password or reset-password (can be added later)

## Frontend

### Dependencies

- `@marsidev/react-turnstile` — lightweight React wrapper for the Turnstile widget

### Widget placement

Render `<Turnstile>` between the last form field and the submit button on both Login and Register pages. Use managed mode (Cloudflare decides whether to show a challenge).

### Token flow

1. Widget renders and runs challenge in the background
2. On success, `onSuccess` callback stores the token in component state
3. Submit button stays disabled until a token is present
4. On form submit, pass the token to the AuthContext function
5. On submission failure, reset the widget so the user can retry

### Env var

- `VITE_TURNSTILE_SITE_KEY` — Cloudflare Turnstile site key

## AuthContext changes

Add `turnstileToken` parameter to `login()` and `register()` functions. Include `turnstile_token` in the JSON body sent to `/auth/login` and `/auth/register`.

## Backend

### Verification helper

Create `auth/turnstile.py` with an async function:

```python
async def verify_turnstile(token: str, ip: str) -> bool
```

- POSTs to `https://challenges.cloudflare.com/turnstile/v0/siteverify`
- Sends `secret` (from env) + `response` (token) + `remoteip` (client IP)
- Returns `True` if `success` is `True` in the response
- Uses `httpx.AsyncClient` for the HTTP call

### Request schema changes

Add `turnstile_token: str` field to:
- `LoginRequest`
- `RegisterRequest`

### Endpoint changes

In both `login()` and `register()` endpoints, call `verify_turnstile()` at the top before any DB work. Return HTTP 400 with a clear error message if verification fails.

### Env var

- `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile secret key

### New dependency

- `httpx` — async HTTP client for the siteverify call

## Error handling

| Scenario | Behavior |
|----------|----------|
| Widget fails to load | Show error message, disable submit |
| Widget times out | Auto-retry (built into Turnstile) |
| Backend verification fails | Return 400 "Bot verification failed", display in existing error banner |
| Missing secret key env var | Log warning, skip verification (graceful degradation in dev) |

## Files to modify

| File | Change |
|------|--------|
| `frontend/package.json` | Add `@marsidev/react-turnstile` |
| `frontend/src/pages/Login.tsx` | Add Turnstile widget, pass token |
| `frontend/src/pages/Register.tsx` | Add Turnstile widget, pass token |
| `frontend/src/contexts/AuthContext.tsx` | Add `turnstileToken` param to `login()` and `register()` |
| `frontend/.env.example` | Add `VITE_TURNSTILE_SITE_KEY` |
| `auth/router.py` | Add `turnstile_token` to schemas, call verify |
| `auth/turnstile.py` | New file — verification helper |
| `requirements.txt` | Add `httpx` |
| `docker-compose.yml` | Add env vars |
| `Dockerfile` | Add `VITE_TURNSTILE_SITE_KEY` build arg |
