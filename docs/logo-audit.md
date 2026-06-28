# Logo Audit — Phase 6 Branding Hotfix

**Date:** 2025-06-23  
**Version:** 1.0.0-rc.1 Branding Hotfix  
**Issue:** Dark rectangular background visible behind Auroranexis logo on marketing pages and inline UI.

---

## Root cause

All inline UI referenced composite PNG assets in `/public/branding/` with **baked-in dark backgrounds** (not alpha-transparent):

| Asset | Size | Problem |
|-------|------|---------|
| `logo-horizontal.png` | ~973 KB | Dark rectangle + wordmark |
| `logo-light.png` | ~1.3 MB | Rounded dark app-icon tile |
| `logo-dark.png` | ~1.2 MB | Black square + circular lockup |
| `icon-512.png` | ~1.3 MB | Black square + gradient mark |

These are suitable for **Open Graph / social / email composites** only — not for navbars, auth shells, or dashboard marks.

---

## Global usage audit

### BrandLogo component (`src/components/branding/brand-logo.tsx`)

| Check | Before | After |
|-------|--------|-------|
| `bg-*` on `<img>` | None | None |
| `rounded-*` on `<img>` | Yes (mark sizes) | **Removed** — only on letter fallback |
| `border-*` / `shadow-*` / padding | None | None |
| Horizontal src | Always `logo-horizontal.png` | `logo-horizontal.svg` (dark text) or `logo-light.svg` on `variant="light"` |
| Mark src | Fell back to `logo-light.png` (dark tile) | Always transparent `icon-mark.svg` or org `iconUrl` |

### Inline usages

| Location | Layout | Fix |
|----------|--------|-----|
| `marketing-header.tsx` | horizontal | SVG wordmark; link wrapper → `flex items-center` (no rounded box) |
| `legal-layout.tsx` | mark → **horizontal** | SVG wordmark on light header |
| `login-branding-shell.tsx` | horizontal | SVG via platform defaults |
| `docs/page.tsx` | horizontal + `variant="light"` | `logo-light.svg` (white text) |
| `workspace-switcher.tsx` | mark | `icon-mark.svg` (no dark tile) |
| `portal-shell.tsx` | mark | `icon-mark.svg` |
| `branding-preview.tsx` | mark ×3 | `icon-mark.svg` on colored preview bars |
| `white-label-workspace.tsx` | mark ×4 | Platform default → SVG; custom uploads unchanged |
| `portal-ui.tsx` | mark | `icon-mark.svg` |

### Direct `img` / asset references

| File | Asset | Fix |
|------|-------|-----|
| `brand-splash.tsx` | `icon-512.png` | → `icon-mark.svg` |
| `metadata.ts` apple icon | `icon512` | → `icon512Composite` (PNG required for Apple touch) |
| `seo.tsx` JSON-LD logo | `icon512` | → `logo-horizontal.svg` |

### Composite PNGs retained (not used inline)

- `hero-banner.png`, `login-screen.png`, `opengraph-1200x630.png`, `linkedin-banner.png`, `splash-screen.png`, `profile-800.png`, `favicon.png`
- Aliased as `*Composite` in `src/lib/branding/assets.ts` where applicable

---

## New transparent assets

| File | Use |
|------|-----|
| `/public/branding/logo-horizontal.svg` | Marketing navbar, auth card, light backgrounds |
| `/public/branding/logo-light.svg` | Dark hero bands (docs hub, secondary headers) |
| `/public/branding/logo-dark.svg` | Alias wordmark (navy text) |
| `/public/branding/icon-mark.svg` | Sidebar, portal, previews, loading splash mark |

All SVGs: **no background rect**, no border, no shadow, no padding.

---

## Marketing pages verified

All use `MarketingHeader` → transparent horizontal SVG:

`/`, `/pilot-program`, `/features`, `/pricing`, `/security`, `/compliance`, `/documentation`, `/contact`, `/support`, `/help`, `/about`, `/careers`, `/status`, `/legal/*`

---

## Remaining branding debt

| Item | Priority | Notes |
|------|----------|-------|
| `profile-800.png` | Low | Avatar fallback composite; not used in nav |
| `favicon.png` | Low | May still contain dark tile; browser favicon only |
| Composite PNG source files | Medium | Regenerate OG/social PNGs from transparent masters when design exports refresh |
| Custom white-label uploads | — | Agency-uploaded logos may include backgrounds; not platform-controlled |
| `PortalLogoMark` (deprecated) | Low | Still has `rounded-lg` in `portal-ui.tsx`; unused in favor of `BrandLogo` |

---

## Validation

| Check | Result |
|-------|--------|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |

---

## Result

Auroranexis logo renders **transparent** on all inline UI surfaces. No dark background rectangle on marketing navbars or platform chrome. Composite PNGs isolated to social/OG/email contexts.
