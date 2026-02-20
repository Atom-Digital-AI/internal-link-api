# Cloudflare Turnstile Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Cloudflare Turnstile bot protection to the Login and Register forms with server-side verification.

**Architecture:** Frontend renders Turnstile managed widget, captures token, sends it with form data. Backend verifies token against Cloudflare's siteverify API before processing auth. Google OAuth is excluded (has its own bot protection).

**Tech Stack:** React + `@marsidev/react-turnstile`, FastAPI + `httpx` (already installed), Cloudflare Turnstile API

---

### Task 1: Backend — Create Turnstile verification helper

**Files:**
- Create: `auth/turnstile.py`

**Step 1: Create the verification helper**

Create `auth/turnstile.py`:

```python
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
```

**Step 2: Commit**

```bash
git add auth/turnstile.py
git commit -m "feat: add Cloudflare Turnstile server-side verification helper"
```

---

### Task 2: Backend — Add turnstile_token to login and register endpoints

**Files:**
- Modify: `auth/router.py`

**Step 1: Add turnstile_token to request schemas**

In `auth/router.py`, add the import at the top with the other imports:

```python
from auth.turnstile import verify_turnstile
```

Add `turnstile_token` field to `RegisterRequest`:

```python
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str
    turnstile_token: str
```

Add `turnstile_token` field to `LoginRequest`:

```python
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False
    turnstile_token: str
```

**Step 2: Add verification to the register endpoint**

In the `register()` function, add Turnstile verification as the very first check (before the password match check, around line 109). Add after the function signature and before the password check:

```python
    # Verify Turnstile token
    client_ip = request.client.host if request.client else None
    if not await verify_turnstile(request_body.turnstile_token, client_ip):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bot verification failed. Please try again.",
        )
```

**Step 3: Add verification to the login endpoint**

In the `login()` function, add Turnstile verification as the very first check (before the DB query, around line 157). Add after `_INVALID_MSG` and before the DB select:

```python
    # Verify Turnstile token
    client_ip = request.client.host if request.client else None
    if not await verify_turnstile(request_body.turnstile_token, client_ip):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bot verification failed. Please try again.",
        )
```

**Step 4: Commit**

```bash
git add auth/router.py
git commit -m "feat: require Turnstile token on login and register endpoints"
```

---

### Task 3: Frontend — Install @marsidev/react-turnstile

**Files:**
- Modify: `frontend/package.json`

**Step 1: Install the package**

```bash
cd frontend && npm install @marsidev/react-turnstile
```

**Step 2: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore: add @marsidev/react-turnstile dependency"
```

---

### Task 4: Frontend — Update AuthContext to accept turnstile token

**Files:**
- Modify: `frontend/src/contexts/AuthContext.tsx`

**Step 1: Update the interface and login function**

In `AuthContextValue` interface, update signatures:

```typescript
login: (email: string, password: string, rememberMe?: boolean, turnstileToken?: string) => Promise<void>
register: (email: string, password: string, confirmPassword: string, turnstileToken?: string) => Promise<void>
```

In the `login` callback, update the signature and body:

```typescript
const login = useCallback(
    async (email: string, password: string, rememberMe = false, turnstileToken?: string) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, remember_me: rememberMe, turnstile_token: turnstileToken }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Login failed.' }))
        throw new Error(err.detail || 'Login failed.')
      }
      const data = await res.json()
      const token: string = data.access_token
      setAccessToken(token)
      const me = await fetchMe(token)
      setUser(me)
    },
    [fetchMe]
  )
```

In the `register` callback, update the signature and body:

```typescript
const register = useCallback(
    async (email: string, password: string, confirmPassword: string, turnstileToken?: string) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, confirm_password: confirmPassword, turnstile_token: turnstileToken }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Registration failed.' }))
        throw new Error(err.detail || 'Registration failed.')
      }
      const data = await res.json()
      const token: string = data.access_token
      setAccessToken(token)
      const me = await fetchMe(token)
      setUser(me)
    },
    [fetchMe]
  )
```

**Step 2: Commit**

```bash
git add frontend/src/contexts/AuthContext.tsx
git commit -m "feat: pass turnstile token through AuthContext login/register"
```

---

### Task 5: Frontend — Add Turnstile widget to Login page

**Files:**
- Modify: `frontend/src/pages/Login.tsx`

**Step 1: Add imports and state**

Add import at the top:

```typescript
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { useRef } from 'react'
```

Update the existing `useState` import to also include `useRef` (or just add the separate import above).

Add state and ref inside the component, after the existing state declarations:

```typescript
const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
const turnstileRef = useRef<TurnstileInstance | null>(null)
```

**Step 2: Update handleSubmit to pass token and reset on failure**

Replace the existing `handleSubmit`:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!turnstileToken) {
      setError('Please complete the verification.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await login(email, password, rememberMe, turnstileToken)
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
      turnstileRef.current?.reset()
      setTurnstileToken(null)
    } finally {
      setLoading(false)
    }
  }
```

**Step 3: Add Turnstile widget to the form**

Insert the `<Turnstile>` component inside the `<form>`, between the "Remember me / Forgot password" row and the submit button (after the closing `</div>` of the remember-me row, before the `<button>`):

```tsx
<Turnstile
  ref={turnstileRef}
  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ''}
  onSuccess={setTurnstileToken}
  onError={() => setTurnstileToken(null)}
  onExpire={() => setTurnstileToken(null)}
  options={{ theme: 'light', size: 'flexible' }}
/>
```

**Step 4: Disable submit button when no token**

Update the submit button's `disabled` prop:

```tsx
disabled={loading || !turnstileToken}
```

Update the button's `background` style to also grey out when no token:

```tsx
background: loading || !turnstileToken ? '#AEAEB2' : '#0071E3',
```

Update the `cursor` style:

```tsx
cursor: loading || !turnstileToken ? 'not-allowed' : 'pointer',
```

**Step 5: Commit**

```bash
git add frontend/src/pages/Login.tsx
git commit -m "feat: add Turnstile widget to login page"
```

---

### Task 6: Frontend — Add Turnstile widget to Register page

**Files:**
- Modify: `frontend/src/pages/Register.tsx`

**Step 1: Add imports and state**

Add import at the top:

```typescript
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { useRef } from 'react'
```

Add state and ref inside the component, after the existing state declarations:

```typescript
const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
const turnstileRef = useRef<TurnstileInstance | null>(null)
```

**Step 2: Update handleSubmit to pass token and reset on failure**

Replace the existing `handleSubmit`:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!turnstileToken) {
      setError('Please complete the verification.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await register(email, password, confirmPassword, turnstileToken)
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.')
      turnstileRef.current?.reset()
      setTurnstileToken(null)
    } finally {
      setLoading(false)
    }
  }
```

**Step 3: Add Turnstile widget to the form**

Insert the `<Turnstile>` component inside the `<form>`, between the confirm password field and the submit button (after the closing `</div>` of the confirm-password field, before the `<button>`):

```tsx
<Turnstile
  ref={turnstileRef}
  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ''}
  onSuccess={setTurnstileToken}
  onError={() => setTurnstileToken(null)}
  onExpire={() => setTurnstileToken(null)}
  options={{ theme: 'light', size: 'flexible' }}
/>
```

**Step 4: Disable submit button when no token**

Update the submit button's `disabled` prop:

```tsx
disabled={loading || passwordMismatch || !turnstileToken}
```

Update the button's `background` style:

```tsx
background: loading || passwordMismatch || !turnstileToken ? '#AEAEB2' : '#0071E3',
```

Update the `cursor` style:

```tsx
cursor: loading || passwordMismatch || !turnstileToken ? 'not-allowed' : 'pointer',
```

**Step 5: Commit**

```bash
git add frontend/src/pages/Register.tsx
git commit -m "feat: add Turnstile widget to register page"
```

---

### Task 7: Config — Add env vars to Dockerfile and docker-compose

**Files:**
- Modify: `Dockerfile`
- Modify: `docker-compose.yml`
- Modify: `frontend/.env.example`

**Step 1: Add build arg to Dockerfile**

In the `Dockerfile`, in the "Build args for Vite environment variables" section (after the `ARG VITE_GOOGLE_CLIENT_ID` line), add:

```dockerfile
ARG VITE_TURNSTILE_SITE_KEY
```

And in the "Set environment variables for build" section (after `ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID`), add:

```dockerfile
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY
```

**Step 2: Add env vars to docker-compose.yml**

In the `api` service's `environment` section, add:

```yaml
      - TURNSTILE_SECRET_KEY=${TURNSTILE_SECRET_KEY:-}
```

In the `frontend` service's `environment` section, add:

```yaml
      - VITE_TURNSTILE_SITE_KEY=${VITE_TURNSTILE_SITE_KEY:-}
```

**Step 3: Update frontend/.env.example**

Add to `frontend/.env.example`:

```
# Cloudflare Turnstile site key — get from https://dash.cloudflare.com/turnstile
# Use Cloudflare's test key for local dev: 1x00000000000000000000AA
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

**Step 4: Commit**

```bash
git add Dockerfile docker-compose.yml frontend/.env.example
git commit -m "chore: add Turnstile env vars to Dockerfile, docker-compose, and .env.example"
```

---

### Task 8: Verify — Build check

**Step 1: Verify frontend compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No type errors.

**Step 2: Verify the backend imports**

```bash
cd /path/to/project && python -c "from auth.turnstile import verify_turnstile; print('OK')"
```

Expected: `OK`

**Step 3: Final commit if any fixes needed**

If any type or import errors were found, fix them and commit:

```bash
git add -A
git commit -m "fix: resolve build issues from Turnstile integration"
```
