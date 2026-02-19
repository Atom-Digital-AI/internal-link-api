# Linki Rebrand Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebrand the app from "LinkScope/Internal Link Pro" to "Linki" with an Apple-esque light theme — `#F5F5F7` surfaces, `#0071E3` blue accent, frosted transparent header, split auth pages, zero hardcoded dark colours remaining.

**Architecture:** CSS custom property overhaul in `index.css` (rename `--chrome-*` → semantic tokens, replace purple gradient with Apple blue), then `App.css` chrome sections updated, then each TSX page/component purged of hardcoded darks and `--chrome-*` references. No logic changes — purely visual.

**Tech Stack:** React 18, TypeScript, plain CSS custom properties (no Tailwind), Vite

---

## Pre-flight checks

Before starting, verify the dev server runs:

```bash
cd /Volumes/ext_drive/internal-link-api/frontend
npm run dev
```

Keep it running in a separate terminal throughout — visual confirmation after each task.

Logo asset path: `frontend/media/images/logos/Linki Logo - No Spacing - Transparent.png`

---

## Task 1: Add new CSS tokens to index.css

**Files:**
- Modify: `frontend/src/index.css`

The entire `:root` block needs replacing. This is the foundation — all subsequent tasks depend on these tokens being correct.

**Step 1: Replace the `:root` block in index.css**

Open `frontend/src/index.css`. Replace the entire `:root { ... }` block (lines 5–115) with:

```css
:root {
  /* === BRAND (Apple Blue) === */
  --brand-primary:        #0071E3;
  --brand-primary-hover:  #0077ED;
  --brand-primary-active: #006CD9;
  --brand-primary-light:  #E8F1FB;
  --brand-primary-glow:   rgba(0, 113, 227, 0.20);

  /* === NAV SURFACE (replaces --chrome-*) === */
  --surface-nav:            transparent;
  --surface-nav-scroll:     rgba(255, 255, 255, 0.82);
  --surface-nav-border:     rgba(0, 0, 0, 0.08);
  --surface-nav-text:       #1D1D1F;
  --surface-nav-text-muted: #6E6E73;
  --surface-nav-accent:     #0071E3;

  /* Legacy aliases — used by components not yet migrated */
  --chrome-bg:         #F5F5F7;
  --chrome-bg-hover:   #EBEBF0;
  --chrome-text:       #1D1D1F;
  --chrome-text-muted: #6E6E73;
  --chrome-border:     rgba(0, 0, 0, 0.10);
  --chrome-accent:     #0071E3;

  /* === SURFACES === */
  --bg-body:        #F5F5F7;
  --bg-card:        #FFFFFF;
  --bg-card-hover:  #FAFAFA;
  --bg-inset:       #F5F5F7;
  --bg-elevated:    #FFFFFF;

  /* === TEXT === */
  --text-primary:   #1D1D1F;
  --text-secondary: #6E6E73;
  --text-tertiary:  #AEAEB2;
  --text-inverse:   #FFFFFF;
  --text-link:      #0071E3;

  /* === BORDERS === */
  --border-default: rgba(0, 0, 0, 0.10);
  --border-subtle:  rgba(0, 0, 0, 0.05);
  --border-strong:  rgba(0, 0, 0, 0.18);

  /* === SEMANTIC COLORS === */
  --color-danger:        #FF3B30;
  --color-danger-bg:     #FFF2F1;
  --color-danger-border: rgba(255, 59, 48, 0.20);
  --color-danger-text:   #D70015;

  --color-success:        #34C759;
  --color-success-bg:     #F0FAF3;
  --color-success-border: rgba(52, 199, 89, 0.20);
  --color-success-text:   #248A3D;

  --color-warning:        #FF9500;
  --color-warning-bg:     #FFF8F0;
  --color-warning-border: rgba(255, 149, 0, 0.20);
  --color-warning-text:   #C93400;

  --color-info:        #0071E3;
  --color-info-bg:     #E8F1FB;
  --color-info-border: rgba(0, 113, 227, 0.20);
  --color-info-text:   #0058B0;

  /* === TYPOGRAPHY === */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;

  --text-xs:   0.6875rem;
  --text-sm:   0.8125rem;
  --text-base: 0.875rem;
  --text-md:   0.9375rem;
  --text-lg:   1.0625rem;
  --text-xl:   1.25rem;
  --text-2xl:  1.5rem;
  --text-3xl:  1.875rem;

  /* === SPACING === */
  --sp-1:  4px;
  --sp-2:  8px;
  --sp-3:  12px;
  --sp-4:  16px;
  --sp-5:  20px;
  --sp-6:  24px;
  --sp-8:  32px;
  --sp-10: 40px;
  --sp-12: 48px;
  --sp-16: 64px;

  /* === RADIUS === */
  --radius-sm:   6px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-2xl:  20px;
  --radius-full: 9999px;

  /* === SHADOWS (lighter — Apple style) === */
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.03);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.03);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.03);
  --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04);
  --shadow-glow: 0 0 20px rgba(0, 113, 227, 0.20);

  /* === TRANSITIONS === */
  --ease:            cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast:   100ms;
  --duration-normal: 180ms;
  --duration-slow:   300ms;

  font-family: var(--font-sans);
  line-height: 1.5;
  font-weight: 400;
  color: var(--text-primary);
  background-color: var(--bg-body);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

Also replace the `::selection` rule at the bottom:
```css
::selection {
  background: rgba(0, 113, 227, 0.15);
}
```

**Step 2: Verify in browser**

Check that the page background is now `#F5F5F7` (light grey) and not white or dark.

**Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: replace CSS tokens with Linki/Apple blue design system"
```

---

## Task 2: Update App.css — header and accent bar

**Files:**
- Modify: `frontend/src/App.css`

**Step 1: Remove the accent bar styles**

Find and delete the entire `.accent-bar` rule block:
```css
/* Gradient accent bar at very top */
.accent-bar {
  height: 3px;
  background: var(--brand-gradient);
  flex-shrink: 0;
}
```

**Step 2: Replace .app-header styles**

Find the `/* === DARK HEADER ===  */` section. Replace `.app-header` and its children with:

```css
/* ==========================================================================
   HEADER — Frosted glass, transparent by default
   ========================================================================== */

.app-header {
  background: var(--surface-nav);
  border-bottom: 1px solid transparent;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 50;
  transition: background var(--duration-normal) var(--ease),
              border-color var(--duration-normal) var(--ease);
  -webkit-backdrop-filter: blur(0px) saturate(100%);
  backdrop-filter: blur(0px) saturate(100%);
}

.app-header.is-scrolled {
  background: var(--surface-nav-scroll);
  border-bottom-color: var(--surface-nav-border);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  backdrop-filter: blur(20px) saturate(180%);
}

.app-header__inner {
  max-width: 1360px;
  margin: 0 auto;
  padding: 0 var(--sp-6);
  height: 56px;
  display: flex;
  align-items: center;
  gap: var(--sp-8);
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  flex-shrink: 0;
  text-decoration: none;
}

.app-header__logo {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.app-header__logo img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.app-header__title {
  margin: 0;
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--surface-nav-text);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.app-header__subtitle {
  display: none;
}
```

**Step 3: Replace step-nav styles**

Find `.step-nav` and its children. Replace with:

```css
.step-nav {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
}

.step-nav::-webkit-scrollbar { display: none; }

.step-nav__item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 5px var(--sp-3);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  white-space: nowrap;
  transition: background var(--duration-fast);
}

.step-nav__item--active {
  background: var(--brand-primary);
  color: #fff;
}

.step-nav__item--done {
  color: var(--text-secondary);
}

.step-nav__num {
  width: 18px;
  height: 18px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 700;
  background: rgba(0,0,0,0.08);
  color: inherit;
  flex-shrink: 0;
}

.step-nav__item--active .step-nav__num {
  background: rgba(255,255,255,0.25);
  color: #fff;
}

.step-nav__label { font-size: var(--text-sm); }

.step-nav__sep {
  width: 16px;
  height: 1px;
  background: var(--border-default);
  margin: 0 var(--sp-1);
  flex-shrink: 0;
}
```

**Step 4: Replace header-btn styles**

Find `.header-btn` and related rules. Replace with:

```css
.header-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 6px var(--sp-3);
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background var(--duration-fast), color var(--duration-fast), border-color var(--duration-fast);
  white-space: nowrap;
  text-decoration: none;
}

.header-btn:hover {
  background: var(--bg-inset);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.header-btn__icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 700;
  background: var(--border-default);
  border-radius: var(--radius-full);
}

.header-btn__badge {
  background: var(--brand-primary);
  color: #fff;
  font-size: 0.625rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  min-width: 18px;
  text-align: center;
}
```

**Step 5: Verify in browser**

The header should now be transparent at the top, frosting when you scroll (will work after Task 3 adds the JS). Logo area will be empty for now — that's fine.

**Step 6: Commit**

```bash
git add frontend/src/App.css
git commit -m "feat: update App.css header to frosted light nav"
```

---

## Task 3: Add scroll listener + logo to App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

**Step 1: Add the scroll listener hook**

After the existing `useEffect` hooks (around line 117), add:

```typescript
// Frosted header on scroll
useEffect(() => {
  const header = document.querySelector('.app-header');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 0);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}, []);
```

**Step 2: Add the logo import**

At the top of the file, after the existing imports, add:

```typescript
import linkiLogo from '../media/images/logos/Linki Logo - No Spacing - Transparent.png';
```

**Step 3: Remove the accent bar**

Find and delete this line (around line 494):
```tsx
{/* ── GRADIENT ACCENT BAR ── */}
<div className="accent-bar" />
```

**Step 4: Update the header brand section**

Find the brand block (around lines 499–505):
```tsx
<div className="app-header__brand">
  <span className="app-header__logo">LS</span>
  <div>
    <h1 className="app-header__title">LinkScope</h1>
    <p className="app-header__subtitle">Internal Link Finder</p>
  </div>
</div>
```

Replace with:
```tsx
<div className="app-header__brand">
  <div className="app-header__logo">
    <img src={linkiLogo} alt="Linki" />
  </div>
  <h1 className="app-header__title">Linki</h1>
</div>
```

**Step 5: Verify in browser**

- Logo should appear in header
- Title reads "Linki"
- No accent bar at top
- Header frosts on scroll

**Step 6: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: rebrand header to Linki with logo and frosted scroll"
```

---

## Task 4: Update App.css — body components

**Files:**
- Modify: `frontend/src/App.css`

Replace all remaining old-brand `rgba(102, 126, 234, ...)` references with their Apple blue equivalents. Work through `App.css` systematically.

**Step 1: Replace all purple rgba references**

Do a find-and-replace across `App.css`:

| Find | Replace |
|------|---------|
| `rgba(102, 126, 234, 0.4)` | `rgba(0, 113, 227, 0.35)` |
| `rgba(102, 126, 234, 0.35)` | `rgba(0, 113, 227, 0.30)` |
| `rgba(102, 126, 234, 0.3)` | `rgba(0, 113, 227, 0.25)` |
| `rgba(102, 126, 234, 0.2)` | `rgba(0, 113, 227, 0.18)` |
| `rgba(102, 126, 234, 0.15)` | `rgba(0, 113, 227, 0.15)` |
| `rgba(102, 126, 234, 0.12)` | `rgba(0, 113, 227, 0.12)` |
| `rgba(102, 126, 234, 0.1)` | `rgba(0, 113, 227, 0.10)` |
| `rgba(102, 126, 234, 0.08)` | `rgba(0, 113, 227, 0.08)` |
| `rgba(239, 68, 68, 0.03)` | `rgba(255, 59, 48, 0.04)` |
| `rgba(239, 68, 68, 0.06)` | `rgba(255, 59, 48, 0.07)` |
| `rgba(15, 23, 42, 0.6)` | `rgba(0, 0, 0, 0.45)` |
| `rgba(241, 245, 249, 0.85)` | `rgba(245, 245, 247, 0.85)` |
| `#334155` | `var(--border-strong)` |

**Step 2: Replace any remaining --brand-gradient references**

Find all remaining uses of `var(--brand-gradient)` in `App.css`. Replace each with `var(--brand-primary)`.

**Step 3: Update primary button styles**

Find the button/`.primary` styles in App.css. Ensure they read:

```css
button.primary,
.primary {
  background: var(--brand-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-full);
  padding: var(--sp-3) var(--sp-5);
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--duration-fast), transform var(--duration-fast);
}

button.primary:hover,
.primary:hover {
  background: var(--brand-primary-hover);
  transform: scale(1.005);
}

button.primary:active,
.primary:active {
  background: var(--brand-primary-active);
  transform: scale(0.998);
}

button.primary:disabled,
.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

**Step 4: Verify in browser**

The main app area should look clean and light. All interactive elements should be Apple blue.

**Step 5: Commit**

```bash
git add frontend/src/App.css
git commit -m "feat: update App.css component colours to Apple blue"
```

---

## Task 5: Rebuild Login.tsx — split layout

**Files:**
- Modify: `frontend/src/pages/Login.tsx`

The current login page is a dark centred card. Replace the entire JSX return with a split layout. Logic (handleSubmit, state) stays 100% unchanged.

**Step 1: Add logo import**

At the top of `Login.tsx`, add:
```typescript
import linkiLogo from '../media/images/logos/Linki Logo - No Spacing - Transparent.png';
```

**Step 2: Replace the return JSX**

Replace the entire `return (...)` with:

```tsx
return (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    fontFamily: 'var(--font-sans)',
  }}>
    {/* Left brand panel — hidden on mobile */}
    <div style={{
      flex: '1',
      background: '#F5F5F7',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px',
      gap: '32px',
    }} className="auth-brand-panel">
      <img src={linkiLogo} alt="Linki" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '2rem', fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.03em' }}>Linki</h1>
        <p style={{ margin: 0, fontSize: '1.0625rem', color: '#6E6E73' }}>Smart internal linking for better SEO</p>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {['AI-powered link suggestions', 'One-click implementation', 'Track link health across your site'].map(item => (
          <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9375rem', color: '#1D1D1F' }}>
            <span style={{ color: '#0071E3', fontWeight: 700, fontSize: '1rem' }}>✓</span>
            {item}
          </li>
        ))}
      </ul>
    </div>

    {/* Right form panel */}
    <div style={{
      width: '100%',
      maxWidth: '480px',
      background: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 40px',
      borderLeft: '1px solid rgba(0,0,0,0.06)',
    }}>
      {/* Mobile-only logo */}
      <div className="auth-mobile-logo" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <img src={linkiLogo} alt="Linki" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.02em' }}>Linki</span>
      </div>

      <div style={{ width: '100%', maxWidth: '360px' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.02em' }}>Sign in</h2>
        <p style={{ margin: '0 0 32px', fontSize: '0.875rem', color: '#6E6E73' }}>Welcome back</p>

        {error && (
          <div style={{
            background: '#FFF2F1',
            border: '1px solid rgba(255,59,48,0.20)',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#D70015',
            fontSize: '0.875rem',
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#1D1D1F', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '11px 14px',
                background: '#F5F5F7',
                border: '1.5px solid transparent',
                borderRadius: '10px',
                fontSize: '0.9375rem',
                color: '#1D1D1F',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 150ms, background 150ms, box-shadow 150ms',
              }}
              onFocus={e => {
                e.target.style.background = '#FFF';
                e.target.style.borderColor = '#0071E3';
                e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)';
              }}
              onBlur={e => {
                e.target.style.background = '#F5F5F7';
                e.target.style.borderColor = 'transparent';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#1D1D1F', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '11px 14px',
                background: '#F5F5F7',
                border: '1.5px solid transparent',
                borderRadius: '10px',
                fontSize: '0.9375rem',
                color: '#1D1D1F',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 150ms, background 150ms, box-shadow 150ms',
              }}
              onFocus={e => {
                e.target.style.background = '#FFF';
                e.target.style.borderColor = '#0071E3';
                e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)';
              }}
              onBlur={e => {
                e.target.style.background = '#F5F5F7';
                e.target.style.borderColor = 'transparent';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: '#6E6E73', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <Link to="/forgot-password" style={{ fontSize: '0.8125rem', color: '#0071E3', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: loading ? '#AEAEB2' : '#0071E3',
              color: '#fff',
              border: 'none',
              borderRadius: '980px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px',
              transition: 'background 150ms',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: '#6E6E73' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#0071E3', textDecoration: 'none', fontWeight: 500 }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  </div>
)
```

**Step 3: Add responsive CSS to index.css**

At the bottom of `frontend/src/index.css`, add:

```css
/* Auth split layout responsive */
@media (max-width: 768px) {
  .auth-brand-panel {
    display: none !important;
  }
  .auth-mobile-logo {
    display: flex !important;
  }
}
```

**Step 4: Verify in browser**

Navigate to `/login`. Should show:
- Desktop: left grey panel with logo + bullets, right white form
- Mobile (< 768px): just the white form with small logo at top

**Step 5: Commit**

```bash
git add frontend/src/pages/Login.tsx frontend/src/index.css
git commit -m "feat: rebuild Login page with Apple-style split layout"
```

---

## Task 6: Rebuild Register.tsx — split layout

**Files:**
- Modify: `frontend/src/pages/Register.tsx`

Same split layout pattern as Login. All state and form logic stays unchanged.

**Step 1: Add logo import**

```typescript
import linkiLogo from '../media/images/logos/Linki Logo - No Spacing - Transparent.png';
```

**Step 2: Replace the JSX return**

Keep all state, handlers, and the `passwordStrength` helper. Only replace the `return (...)`:

```tsx
return (
  <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'var(--font-sans)' }}>
    {/* Left brand panel */}
    <div style={{
      flex: '1',
      background: '#F5F5F7',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px',
      gap: '32px',
    }} className="auth-brand-panel">
      <img src={linkiLogo} alt="Linki" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '2rem', fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.03em' }}>Linki</h1>
        <p style={{ margin: 0, fontSize: '1.0625rem', color: '#6E6E73' }}>Smart internal linking for better SEO</p>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {['AI-powered link suggestions', 'One-click implementation', 'Track link health across your site'].map(item => (
          <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9375rem', color: '#1D1D1F' }}>
            <span style={{ color: '#0071E3', fontWeight: 700 }}>✓</span>
            {item}
          </li>
        ))}
      </ul>
    </div>

    {/* Right form panel */}
    <div style={{
      width: '100%',
      maxWidth: '480px',
      background: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 40px',
      borderLeft: '1px solid rgba(0,0,0,0.06)',
      overflowY: 'auto',
    }}>
      <div className="auth-mobile-logo" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <img src={linkiLogo} alt="Linki" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.02em' }}>Linki</span>
      </div>

      <div style={{ width: '100%', maxWidth: '360px' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.02em' }}>Create account</h2>
        <p style={{ margin: '0 0 32px', fontSize: '0.875rem', color: '#6E6E73' }}>Free forever, upgrade when ready</p>

        {error && (
          <div style={{ background: '#FFF2F1', border: '1px solid rgba(255,59,48,0.20)', borderRadius: '10px', padding: '12px 16px', color: '#D70015', fontSize: '0.875rem', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(['email', 'password', 'confirmPassword'] as const).map(field => (
            <div key={field}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#1D1D1F', marginBottom: '6px' }}>
                {field === 'email' ? 'Email' : field === 'password' ? 'Password' : 'Confirm password'}
              </label>
              <input
                type={field === 'email' ? 'email' : 'password'}
                value={field === 'email' ? email : field === 'password' ? password : confirmPassword}
                onChange={e => field === 'email' ? setEmail(e.target.value) : field === 'password' ? setPassword(e.target.value) : setConfirmPassword(e.target.value)}
                required
                placeholder={field === 'email' ? 'you@example.com' : '••••••••'}
                style={{
                  width: '100%', padding: '11px 14px', background: '#F5F5F7',
                  border: '1.5px solid transparent', borderRadius: '10px',
                  fontSize: '0.9375rem', color: '#1D1D1F', outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 150ms, background 150ms, box-shadow 150ms',
                }}
                onFocus={e => { e.target.style.background = '#FFF'; e.target.style.borderColor = '#0071E3'; e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                onBlur={e => { e.target.style.background = '#F5F5F7'; e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none'; }}
              />
              {field === 'password' && password && (
                <div style={{ marginTop: '6px', fontSize: '0.75rem', color: passwordStrength(password).pass ? '#248A3D' : '#6E6E73' }}>
                  {passwordStrength(password).label}
                </div>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              background: loading ? '#AEAEB2' : '#0071E3',
              color: '#fff', border: 'none', borderRadius: '980px',
              fontSize: '1rem', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px', transition: 'background 150ms',
            }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: '#6E6E73' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#0071E3', textDecoration: 'none', fontWeight: 500 }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  </div>
)
```

Note: the Register.tsx file uses `confirmPassword` state and a `passwordStrength` helper — check the actual file for the exact state variable names before substituting. Adapt the field names accordingly.

**Step 3: Verify in browser**

Navigate to `/register`. Same split layout as login.

**Step 4: Commit**

```bash
git add frontend/src/pages/Register.tsx
git commit -m "feat: rebuild Register page with split layout"
```

---

## Task 7: Update ForgotPassword.tsx and ResetPassword.tsx

**Files:**
- Modify: `frontend/src/pages/ForgotPassword.tsx`
- Modify: `frontend/src/pages/ResetPassword.tsx`

These are simpler single-form pages. No split layout needed — just light centred card.

**Step 1: Add logo import to both files**

```typescript
import linkiLogo from '../media/images/logos/Linki Logo - No Spacing - Transparent.png';
```

**Step 2: Update ForgotPassword.tsx return**

Replace the outer wrapper `<div>` (currently `background: 'var(--chrome-bg)'`) with:

```tsx
<div style={{
  minHeight: '100vh',
  background: '#F5F5F7',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
}}>
```

Replace the card `<div>` (currently `background: '#1e293b'`) with:

```tsx
<div style={{
  width: '100%',
  maxWidth: '400px',
  background: '#FFFFFF',
  borderRadius: '16px',
  padding: '40px',
  border: '1px solid rgba(0,0,0,0.06)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
}}>
```

Inside the card header section, replace the letter-mark logo with:

```tsx
<img src={linkiLogo} alt="Linki" style={{ width: '48px', height: '48px', objectFit: 'contain', margin: '0 auto var(--sp-4)', display: 'block' }} />
```

Replace all `color: 'var(--chrome-text)'` → `color: '#1D1D1F'`
Replace all `color: 'var(--chrome-text-muted)'` → `color: '#6E6E73'`
Replace all `color: 'var(--chrome-accent)'` → `color: '#0071E3'`
Replace `background: '#0f172a'` (input bg) → `background: '#F5F5F7'`
Replace `border: '1px solid var(--chrome-border)'` → `border: '1.5px solid transparent'`
Replace `color: 'var(--chrome-text)'` on inputs → `color: '#1D1D1F'`
Replace the submit button gradient background → `background: '#0071E3'`
Replace the submit button `borderRadius: 'var(--radius-md)'` → `borderRadius: '980px'`

Apply the same changes to `ResetPassword.tsx`.

**Step 3: Verify in browser**

Both `/forgot-password` and `/reset-password` should show a clean white card on grey background.

**Step 4: Commit**

```bash
git add frontend/src/pages/ForgotPassword.tsx frontend/src/pages/ResetPassword.tsx
git commit -m "feat: update ForgotPassword and ResetPassword to light theme"
```

---

## Task 8: Update Pricing.tsx

**Files:**
- Modify: `frontend/src/pages/Pricing.tsx`

**Step 1: Replace outer wrapper**

```tsx
// Before
background: 'var(--chrome-bg)',

// After
background: '#F5F5F7',
```

**Step 2: Replace heading colours**

```tsx
// Before
color: 'var(--chrome-text)'

// After
color: '#1D1D1F'
```

```tsx
// Before
color: 'var(--chrome-text-muted)'

// After
color: '#6E6E73'
```

**Step 3: Replace the interval toggle**

```tsx
// Before
background: '#1e293b', border: '1px solid var(--chrome-border)'

// After
background: '#EBEBF0', border: '1px solid rgba(0,0,0,0.08)'
```

Active toggle button:
```tsx
// Before
background: interval === 'monthly' ? 'var(--brand-gradient)' : 'transparent'

// After
background: interval === 'monthly' ? '#0071E3' : 'transparent'
color: interval === 'monthly' ? 'white' : '#6E6E73'
```

**Step 4: Replace plan cards**

Both card `<div>` wrappers:
```tsx
// Before
background: '#1e293b', border: '1px solid var(--chrome-border)'

// After
background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)',
boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
```

Pro card highlighted border:
```tsx
// Before
border: '2px solid var(--chrome-accent)'

// After
border: '2px solid #0071E3'
```

**Step 5: Replace the POPULAR badge**

```tsx
// Before
background: 'var(--brand-gradient)'

// After
background: '#0071E3'
```

**Step 6: Replace feature list colours and buttons**

- `color: 'var(--chrome-text)'` → `'#1D1D1F'`
- `color: '#475569'` → `'#AEAEB2'`
- Upgrade button: `background: 'var(--brand-gradient)'` → `'#0071E3'`, `borderRadius: 'var(--radius-md)'` → `'980px'`
- Manage button: `border: '1px solid var(--chrome-accent)'`, `color: 'var(--chrome-accent)'` → `'#0071E3'`
- "Current plan" chip: `border: '1px solid var(--chrome-border)'`, `color: 'var(--chrome-text-muted)'` → `rgba(0,0,0,0.12)` and `'#6E6E73'`

**Step 7: Verify in browser**

Navigate to `/pricing`. Should show a clean light page with two white cards, blue highlight on Pro.

**Step 8: Commit**

```bash
git add frontend/src/pages/Pricing.tsx
git commit -m "feat: update Pricing page to light Apple theme"
```

---

## Task 9: Update Account.tsx

**Files:**
- Modify: `frontend/src/pages/Account.tsx`

**Step 1: Read the file first**

```bash
cat frontend/src/pages/Account.tsx
```

Note all inline style objects with `--chrome-*`, `#1e293b`, `#0f172a`, `--brand-gradient`.

**Step 2: Apply replacements**

| Before | After |
|--------|-------|
| `background: '#1e293b'` | `background: '#FFFFFF'` |
| `background: '#0f172a'` | `background: '#F5F5F7'` |
| `border: '1px solid var(--chrome-border)'` | `border: '1px solid rgba(0,0,0,0.08)'` |
| `color: 'var(--chrome-text)'` | `color: '#1D1D1F'` |
| `color: 'var(--chrome-text-muted)'` | `color: '#6E6E73'` |
| `color: 'var(--chrome-accent)'` | `color: '#0071E3'` |
| `border: '1px solid var(--chrome-accent)'` | `border: '1px solid #0071E3'` |
| `background: 'var(--brand-gradient)'` | `background: '#0071E3'` |

Any button with gradient background: add `borderRadius: '980px'` for pill shape.

**Step 3: Verify in browser**

Navigate to `/account`. Should be a clean light page.

**Step 4: Commit**

```bash
git add frontend/src/pages/Account.tsx
git commit -m "feat: update Account page to light theme"
```

---

## Task 10: Update ContextualEditor.tsx modal

**Files:**
- Modify: `frontend/src/components/detail/ContextualEditor.tsx`

**Step 1: Find the upgrade modal (around line 203)**

Replace the hardcoded dark modal styles:

```tsx
// Modal backdrop — keep dark overlay
position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',  // was 0.6

// Modal card — was '#1e293b'
background: '#FFFFFF',
border: '1px solid rgba(0,0,0,0.08)',
boxShadow: '0 20px 40px rgba(0,0,0,0.15)',

// Heading — was '#e2e8f0'
color: '#1D1D1F',

// Body text — was '#94a3b8'
color: '#6E6E73',

// Primary button — was linear-gradient(135deg, #667eea 0%, #764ba2 100%)
background: '#0071E3',
borderRadius: '980px',
border: 'none',
color: 'white',

// Cancel button — was transparent with #475569 border
background: '#F5F5F7',
border: '1px solid transparent',
borderRadius: '980px',
color: '#1D1D1F',
```

**Step 2: Verify**

Go to the detail view of an analysis result and trigger the upgrade modal. Should look clean and light.

**Step 3: Commit**

```bash
git add frontend/src/components/detail/ContextualEditor.tsx
git commit -m "feat: update ContextualEditor upgrade modal to light theme"
```

---

## Task 11: Final audit — find any remaining dark remnants

**Step 1: Run the audit**

```bash
grep -rn "#1e293b\|#0f172a\|#334155\|667eea\|764ba2\|brand-gradient\|chrome-bg\b\|chrome-text\b\|chrome-border\b" \
  frontend/src --include="*.tsx" --include="*.ts" --include="*.css"
```

**Step 2: Fix any remaining hits**

Apply the same substitution patterns from previous tasks to any remaining occurrences.

**Step 3: Run the audit again to confirm zero hits**

Expected output: no matches.

**Step 4: Final commit**

```bash
git add -p  # stage any fixes
git commit -m "feat: complete Linki rebrand — remove all dark theme remnants"
```

---

## Task 12: Update page title

**Files:**
- Modify: `frontend/index.html`

**Step 1: Find and update the title tag**

```html
<!-- Before -->
<title>Internal Link Pro</title>

<!-- After -->
<title>Linki — Smart Internal Linking</title>
```

Also update the favicon if one exists — the Linki logo makes a good favicon (add as `favicon.png` to `public/`).

**Step 2: Commit**

```bash
git add frontend/index.html
git commit -m "chore: update page title to Linki"
```

---

## Done — smoke test checklist

After all tasks:

- [ ] `/` — App loads with light header, transparent at top, frosts on scroll
- [ ] Header shows Linki logo + "Linki" wordmark
- [ ] Step nav pills are blue when active
- [ ] `/login` — Split layout, left panel hidden on mobile
- [ ] `/register` — Same split layout
- [ ] `/forgot-password` — White card on grey bg
- [ ] `/pricing` — Light page, blue Pro card border, blue buttons
- [ ] `/account` — Light page, no dark surfaces
- [ ] Detail view upgrade modal — white card
- [ ] `grep` audit returns zero dark colour hits
