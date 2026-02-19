# Linki Rebrand Design

**Date:** 2026-02-19
**Approach:** Full design token overhaul + component audit (no hardcoded colours left)
**Style:** Apple-esque — light surfaces, `#F5F5F7` grey, `#0071E3` blue accent, frosted nav

---

## 1. Brand Identity

- **Name:** "Linki" (replaces "Internal Link Pro")
- **Logo:** Metallic chain link icon with blue dot (provided image asset)
- **Wordmark:** "Linki" in SF Pro / Inter, weight 600, `letter-spacing: -0.02em`, `#1D1D1F`
- **Primary accent:** `#0071E3` (Apple blue) — used for buttons, links, focus rings, active states
- **No gradients** as primary brand expression — logo carries the visual interest

---

## 2. Design Tokens (index.css)

### Brand
```css
--brand-primary:        #0071E3
--brand-primary-hover:  #0077ED
--brand-primary-active: #006CD9
--brand-primary-light:  #E8F1FB
--brand-primary-glow:   rgba(0, 113, 227, 0.20)
```

### Navigation surfaces (replaces --chrome-*)
```css
--surface-nav:           transparent
--surface-nav-scroll:    rgba(255, 255, 255, 0.82)
--surface-nav-blur:      blur(20px) saturate(180%)
--surface-nav-border:    rgba(0, 0, 0, 0.08)
--surface-nav-text:      #1D1D1F
--surface-nav-text-muted: #6E6E73
```

### Page surfaces
```css
--bg-body:        #F5F5F7
--bg-card:        #FFFFFF
--bg-card-hover:  #FAFAFA
--bg-inset:       #F5F5F7
--bg-elevated:    #FFFFFF
```

### Text
```css
--text-primary:   #1D1D1F
--text-secondary: #6E6E73
--text-tertiary:  #AEAEB2
--text-inverse:   #FFFFFF
--text-link:      #0071E3
```

### Borders
```css
--border-default: rgba(0, 0, 0, 0.10)
--border-subtle:  rgba(0, 0, 0, 0.05)
--border-strong:  rgba(0, 0, 0, 0.18)
```

### Shadows (lighter than current)
```css
--shadow-xs: 0 1px 2px rgba(0,0,0,0.04)
--shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.03)
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.03)
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.03)
--shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)
--shadow-glow: 0 0 20px rgba(0,113,227,0.20)
```

### Semantic colours (updated to Apple system colours)
```css
--color-danger:        #FF3B30
--color-danger-bg:     #FFF2F1
--color-danger-border: rgba(255,59,48,0.20)
--color-danger-text:   #D70015

--color-success:        #34C759
--color-success-bg:     #F0FAF3
--color-success-border: rgba(52,199,89,0.20)
--color-success-text:   #248A3D

--color-warning:        #FF9500
--color-warning-bg:     #FFF8F0
--color-warning-border: rgba(255,149,0,0.20)
--color-warning-text:   #C93400

--color-info:        #0071E3
--color-info-bg:     #E8F1FB
--color-info-border: rgba(0,113,227,0.20)
--color-info-text:   #0058B0
```

---

## 3. Header / Navigation (App.css)

- **Accent bar removed** — `.accent-bar` class deleted
- **Default state:** `background: transparent`, no border, no shadow
- **Scrolled state** (`.app-header.is-scrolled`):
  - `background: rgba(255,255,255,0.82)`
  - `backdrop-filter: blur(20px) saturate(180%)`
  - `border-bottom: 1px solid rgba(0,0,0,0.08)`
  - Transition: `background 200ms ease, border-color 200ms ease`
- **Logo:** `<img>` of the Linki chain icon at 28px, + "Linki" wordmark text
- **Step nav pills:**
  - Active: `#0071E3` bg, white text
  - Inactive: `#F5F5F7` bg, `#6E6E73` text
  - Hover: `#E8F1FB` bg
- **User chips / badges:** `#F5F5F7` bg, `#1D1D1F` text — no dark backgrounds

---

## 4. Auth Pages (Login / Register / ForgotPassword / ResetPassword)

Split layout, responsive:

```
┌─────────────────────────┬─────────────────────────┐
│   Brand panel           │   Form panel            │
│   bg: #F5F5F7           │   bg: #FFFFFF           │
│                         │                         │
│   [Linki logo 56px]     │   [Form content]        │
│   "Linki"               │                         │
│   Tagline               │                         │
│   • Feature 1           │                         │
│   • Feature 2           │                         │
│   • Feature 3           │                         │
└─────────────────────────┴─────────────────────────┘
```

- **Left panel** (hidden on mobile < 768px):
  - `#F5F5F7` bg, centered vertically
  - Logo image 56px + "Linki" heading
  - Tagline: "Smart internal linking for better SEO"
  - Bullets: "AI-powered suggestions", "One-click implementation", "Track link health"
  - Blue checkmark icons (`#0071E3`)

- **Right panel:**
  - Pure white bg, full height
  - Form centred at max-width 360px
  - On mobile: shows a small logo at top

- **Inputs:** `background: #F5F5F7`, `border: 1.5px solid transparent`, `border-radius: 10px`; focus → `border-color: #0071E3`, `background: #FFF`, `box-shadow: 0 0 0 3px rgba(0,113,227,0.15)`

- **Primary CTA button:** `#0071E3` bg, white text, `border-radius: 980px`, full width, 44px height

- **Links:** `#0071E3`, no underline, hover → underline

---

## 5. Buttons & Interactive Elements

**Primary:**
- `background: #0071E3`, white text, `border-radius: 980px`
- Hover: `#0077ED`, `transform: scale(1.005)`
- Active: `#006CD9`

**Secondary:**
- `background: #F5F5F7`, `#1D1D1F` text, `border-radius: 980px`
- Hover: `#E8E8ED`
- No border

**Danger:**
- `background: #FF3B30`, white text, same pill shape

**Pro badge / upgrade pills:**
- `background: #0071E3`, white text, pill shape
- Replace all gradient badges

---

## 6. Cards & Containers

- `background: #FFFFFF`
- `border: 1px solid rgba(0,0,0,0.06)`
- `border-radius: 12px`
- `box-shadow: 0 2px 8px rgba(0,0,0,0.06)`
- Hover: `box-shadow: 0 4px 16px rgba(0,0,0,0.10)`

---

## 7. Component Audit Scope

Files requiring hardcoded colour removal:
- `frontend/src/index.css` — token definitions
- `frontend/src/App.css` — chrome/header/nav/component styles
- `frontend/src/pages/Login.tsx` — hardcoded `#1e293b`, `var(--chrome-bg)`
- `frontend/src/pages/Register.tsx` — same pattern
- `frontend/src/pages/ForgotPassword.tsx` — likely same
- `frontend/src/pages/ResetPassword.tsx` — likely same
- `frontend/src/pages/Pricing.tsx` — check for dark colours
- `frontend/src/pages/Account.tsx` — check for dark colours
- `frontend/src/App.tsx` — header scroll JS class toggle to add
- `frontend/src/components/*` — full audit for hardcoded colours

---

## 8. Logo Asset

- Save provided logo image as `frontend/public/linki-logo.png`
- Reference in header as `<img src="/linki-logo.png" alt="Linki" />`
- Also use on auth page left panel (larger, ~56px)

---

## 9. What Is NOT Changing

- All component logic, API calls, routing
- Spacing tokens (`--sp-*`)
- Border radius tokens (`--radius-*`)
- Typography scale (`--text-*`)
- Font stack (Inter already has `-apple-system` fallback — keep)
- Transition tokens
