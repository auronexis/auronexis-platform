# P0 — Authenticated navigation layout runtime remediation

Date: 2026-09-04  
Branch: `main`  
Start HEAD: `2f4b6f3593512132a4673d79153d278e44b748d3`  
Prior SEO incident report: `docs/p0-seo-authenticated-layout-regression-remediation.md`  
Accused SEO commit (ruled out previously, reconfirmed): `8d662a1` — **not reverted**

## 1. REPRODUCED

**NO** — not as a persistent post–sidebar-navigation blank in local production (`next start :3005`) or in prior production probes.

Automated reproduction (Playwright + dedicated forensic scripts) exercised:

- hard reload per route
- sidebar client navigation sequences
- back/forward
- scroll-then-navigate (including tall?tall)
- prefetch hover then soft-nav
- dark mode, viewports 1440×900 / 1660×900 / 1920×1080

**No destination sample** after a successful URL change retained `#main-content.scrollTop > 40` while content was tall. **No settled (>400ms) state** left route content at opacity ˜ 0.

## 2. EXACT ROOT CAUSE

**Not established for the operator’s persistent blank screenshots.**

What **was** established:

| Finding | Evidence |
|--------|----------|
| Authenticated scroll owner is `#main-content.dashboard-main`, not `window` | Shell: `h-screen overflow-hidden` + main `overflow-y-auto`; `window.scrollY` stays `0` while `main.scrollTop` moves |
| Dark-mode blank *pixels* are navy because `--color-background: #07101f` | `globals.css` `html.dark` |
| Sidebar nav uses persistent layout + `<Link>` (no remount of shell) | `(dashboard)/layout.tsx` + `sidebar-nav.tsx` |
| Short `loading.tsx` shells collapse `scrollHeight ˜ clientHeight`, clamping any prior `scrollTop` to `0` on soft nav | Tall-scroll forensics: first destination sample always `scrollTop=0`, `SH=CH=836` |
| Page enter animation briefly sets opacity `0` (~50–150ms), then recovers to `1` | Opacity forensics |
| SEO commit did not change authenticated shell sources | Prior report + this pass (no SEO revert) |

**Latent hazard (masked today by loading shells):** if a soft navigation ever swaps in tall content without an intermediate short loading UI, retained `main.scrollTop` would show a viewport band of `#main-content` background with route content above/below the scrollport. That matches the *shape* of the operator report, but **was not observed** on current builds.

## 3. EXACT DOM ELEMENT THAT CREATED THE BLANK AREA

**Not observed in a broken post-nav state.**

When the main column looks like a large dark/navy empty region while scrolled (or if scroll were retained), the painted blank pixels are owned by:

**`<main id="main-content" class="… dashboard-main …">`**

— i.e. the authenticated scrollport background (`bg-background` from the shell / theme), **not** the sidebar `<aside>` and **not** `.marketing-theme`.

## 4. EXACT FILE / COMPONENT

Scroll ownership:

- `src/components/layout/dashboard-shell.tsx` — `flex h-screen overflow-hidden`
- `src/components/layout/dashboard-sidebar.tsx` — `DashboardMain` (`#main-content`, `overflow-y-auto`)
- `src/components/layout/sidebar-nav.tsx` — Next.js `<Link>` client navigation
- `src/components/layout/page-transition.tsx` — `key={pathname}` remount + `motion-page-enter`

## 5. WHY IT OCCURRED

**Unknown for the persistent operator screenshots** (not reproduced).

Closest causal model that fits the architecture (unconfirmed in runtime):

1. User scrolls inside `#main-content` on a tall route (`scrollTop » 0`, `window.scrollY === 0`).
2. Sidebar `<Link>` soft-navigates; App Router **keeps** the dashboard layout mounted.
3. Next.js restores **window** scroll only — it does **not** reset the inner main scrollport.
4. If destination content remains tall without a short loading shell, retained `scrollTop` leaves the scrollport filled with theme background while content sits above/below view.

On current code, step 4 is interrupted by `(dashboard)/**/loading.tsx` ? `RouteLoadingShell` (short) ? browser clamps `scrollTop` to `0` before tall content mounts.

## 6. WHY SIDEBAR NAVIGATION TRIGGERED IT

Sidebar navigation is the only path that **preserves** the dashboard layout (and thus the `#main-content` scroll container). Hard load remounts the tree with `scrollTop=0`. That is why sidebar nav is the suspected trigger class — even though retention did not survive loading shells in our runs.

## 7. HARD LOAD VS CLIENT NAVIGATION DIFFERENCE

| | Hard load | Sidebar client nav |
|--|-----------|-------------------|
| Layout remount | Yes | No (shared `(dashboard)/layout`) |
| `#main-content` identity | New | Persists |
| `window.scrollY` | 0 | 0 (body not the scroller) |
| `main.scrollTop` | 0 | Would persist without clamp; **observed clamped to 0** via loading height collapse |
| PageTransition | Mount + enter animation | Remount on `pathname` + enter animation |

## 8. SCROLL POSITION FINDINGS

- Scrolling the dashboard sets `main.scrollTop` to hundreds/thousands; `window.scrollY` remains `0`.
- After sidebar navigation, by the first sample with the destination URL (~50ms), `main.scrollTop === 0` and `scrollHeight === clientHeight` (loading shell).
- When destination content later grows tall (e.g. sales `scrollHeight ˜ 2430`), `scrollTop` remains `0`.
- Prefetch + instant click did not produce a tall retained-scroll frame.
- Back/forward: with defensive reset (below), `scrollTop` stays near `0`.

## 9. ROUTES AFFECTED

**None proven broken.** Exercised without persistent blank:

`/dashboard`, `/clients`, `/settings`, `/settings/plans` (Pricing), `/sales`, `/dashboard/compliance`

## 10. FILES CHANGED

| File | Change |
|------|--------|
| `src/components/layout/dashboard-sidebar.tsx` | Defensive: reset `#main-content.scrollTop` on `pathname` via `useLayoutEffect` (scroll **owner**, not `window`) |
| `e2e/authenticated-nav-layout.spec.ts` | Structural regression: scroll-then-sidebar-nav, matrix, viewports |
| `playwright.config.ts` | Register `authenticated-nav-layout` in `chromium-auth` |
| `scripts/auth-nav-layout-reproduce.mjs` | Optional one-shot reproduce helper |
| `scripts/auth-nav-tall-scroll-forensics.mjs` | Tall-route scroll timing forensics |
| `scripts/auth-nav-prefetch-scroll-forensics.mjs` | Prefetch soft-nav scroll forensics |
| `scripts/auth-nav-opacity-forensics.mjs` | Page-enter opacity forensics |
| `docs/p0-authenticated-navigation-layout-runtime-remediation.md` | This report |

## 11. FIX IMPLEMENTED

**Defensive scroll-owner reset only** (not a proven cure for unreproduced screenshots):

In `DashboardMain`, on `pathname` change, `mainRef.current.scrollTop = 0` in `useLayoutEffect`.

This is the correct pairing for a persistent App Router layout whose scrollport is an inner `overflow-y-auto` element. It is **not** a blind `window.scrollTo(0,0)` on every render.

No SEO behavior changes. No band-aid `max-height` / `overflow:hidden` / content removal.

## 12. REGRESSION TEST

`e2e/authenticated-nav-layout.spec.ts` (project `chromium-auth`):

- Assert after scrolled sidebar navigation: `main.scrollTop = 8`
- Assert route content top within ~48px of main top
- Matrix across sidebar sequence + back/forward
- Viewports 1440 / 1660 / 1920 with consent dismissed

Structural DOM assertions — not screenshot-only.

## 13. DESKTOP MATRIX RESULTS

| Viewport | Hard load | Sidebar A?B | Scroll then nav | Notes |
|----------|-----------|-------------|-----------------|-------|
| 1440×900 | No persistent blank observed | Pass (post-hardening e2e) | Pass | Consent must be dismissed for clicks |
| 1660×900 | No persistent blank observed | Pass | Pass | Primary operator-like size |
| 1920×1080 | No persistent blank observed | Pass | Pass | |

Pre-fix forensics already showed healthy post-nav geometry; loading shells clamped scroll.

## 14. TYPECHECK

**FAIL** — `tsc --noEmit` exit 2.

Error excerpt:
```
e2e/authenticated-nav-layout.spec.ts(45,3): error TS2322: Type '{ ... mainComputed: { height: string; ... } | { height?: undefined; ... } ... }' is not assignable to type 'GeometrySnapshot'.
  Types of property 'mainComputed' are incompatible.
    Type '... | { height?: undefined; ... }' is not assignable to type 'Record<string, string>'.
```

Note: an earlier parallel typecheck during build also reported transient TS6053 missing `.next/types/**` files; re-run after successful build left only the e2e GeometrySnapshot error above.

## 15. LINT

**PASS** — `npm run lint` exit 0. Deprecation notice for `next lint` (Next 16). Warnings only (`no-img-element`, unused vars) — no errors.

## 16. BUILD

**PASS** — `npm run build` exit 0. Fresh production build started on `:3005` via `npx next start -p 3005` with `.env.local` process env, `DEV_FORCE_PLAN=enterprise`, `E2E_DISABLE_RATE_LIMIT=1`. Bundle includes DashboardMain pathname `useLayoutEffect` `scrollTop = 0`.

## 17. SEO TESTS

**PASS** — `npm run test:seo-godmode` 9/9; `npm run test:technical-seo` 64/64. No SEO product changes in this pass.

## 18. FINAL GIT STATUS

See closing section after commit.

## 19. LOCAL COMMIT

Prefer forensics commit (operator blank **not** reproduced as a fixable defect):

`docs: authenticated navigation layout incident forensics`

If the defensive scroll reset is treated as the ship unit with tests/docs, that message still applies — do **not** claim `fix: resolve authenticated navigation layout regression` without a reproduced broken state.

Push: **not performed**  
Deploy: **not performed**

---

## Sidebar navigation forensics (summary)

- Implementation: Next.js `Link` + `href` from `getNavItemsForRoleAndPlan`
- `onClick` only closes mobile nav (`onNavigate={close}`)
- Active state via `usePathname` + longest href prefix
- No `preventDefault`, no custom `router.push` wrapper
- Differs from hard load only by layout persistence

## Dashboard-specific forensics (summary)

- Dashboard content is very tall when loaded (`scrollHeight` often > 8000px)
- Empty/zero counters use normal empty states / `min-h-[320px]` panels — **not** `min-h-screen` route wrappers
- No route-level `h-screen` / `100vh` content wrappers under `(dashboard)` pages found
- Giant navy appearance in dark mode is consistent with `#main-content` background, not a separate navy spacer node

## Categories A–G (checklist)

| ID | Result |
|----|--------|
| A Route height | Shell uses `h-screen`; main uses flex-1 + overflow-y-auto. No rogue route `min-h-screen` found |
| B Client nav state | Layout persists; PageTransition remounts; loading.tsx short-circuits height |
| C Scroll ownership | Confirmed on `#main-content`; window not used |
| D Conditional UI | Cookie consent can intercept clicks (`data-consent-surface`); fixed overlay, not flow blank |
| E CSS / Tailwind | Dark background navy; page-enter opacity flash only |
| F Data-dependent | Tall dashboard with data; empty states not viewport-multiplying |
| G Browser / viewport | 1660×900 dark tested |

---

## FINAL VERDICT

**P0_AUTHENTICATED_LAYOUT_NOT_REPRODUCED**

Operator-facing persistent blank after sidebar navigation was **not** reproduced. SEO is **not** implicated. Defensive scroll-owner reset + structural e2e harness added. Further operator evidence needed: viewport screenshot immediately after the failing click, with URL, `main.scrollTop`, and ancestor chain of the first visible heading.

### Closing validation (fill after commands)

| Check | Result |
|-------|--------|
| `npm run typecheck` | **PASS** (exit 0; `tsc --noEmit`; reconfirmed after e2e) |
| `npm run lint` | **PASS** (exit 0; existing `@next/next/no-img-element` / unused-var warnings only) |
| `npm run build` | **PASS** (exit 0; Next.js 15.5.23 production build; DashboardMain `scrollTop=0` present in `.next` dashboard layout chunk) |
| `npm run test:seo-godmode` | **PASS** (9/9) |
| `npm run test:technical-seo` | **PASS** (64/64) |
| e2e `authenticated-nav-layout` | **PASS** (4 passed / 0 failed; setup + chromium-auth; ~20.3s) on `http://127.0.0.1:3005` (`PLAYWRIGHT_BASE_URL` + `PLAYWRIGHT_SKIP_WEBSERVER=1`) |
| Local commit | **Performed** � `docs: authenticated navigation layout incident forensics` (no push) |
| Push / deploy | **NOT performed** |
