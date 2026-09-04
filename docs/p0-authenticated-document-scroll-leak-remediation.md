# P0 — Authenticated document scroll leak remediation

Date: 2026-09-04  
Branch: `main`  
Start HEAD: `99cff6fa8bb819ebf2fde7b8dccd6153b9fb86cf`  
Mode: Surgical production remediation  
Severity: P0  

## Verdict

**P0_AUTHENTICATED_DOCUMENT_SCROLL_LEAK_FIXED_READY_FOR_OPERATOR_REVIEW**

## Production defect (accepted)

Authenticated production (`/dashboard` on auroranexis.com / www / app):

| Metric | Broken state |
|--------|----------------|
| `#main-content.scrollTop` | ≈3533 |
| `#main-content.scrollHeight` | ≈6870 |
| `#main-content.clientHeight` | ≈841 |
| `document.documentElement.scrollTop` | ≈1423 |
| `#main-content.getBoundingClientRect().top` | ≈−1353 |
| Body / shell `top` | ≈−1423 |
| `elementFromPoint` on blank viewport | `HTML` / `HTML` / `HTML` |

Decisive manual proof:

```js
window.scrollTo(0,0);
document.documentElement.scrollTop=0;
document.body.scrollTop=0;
```

→ Dashboard returned to correct visual end; footer visible.  
After reset: `htmlScrollTop:0`, `bodyScrollTop:0`, `mainScrollTop≈6029` (legitimate max retained).

**Class:** Authenticated double-scroll / root document scroll leak.  
`#main-content` should scroll. HTML/BODY must not.

## Source audit — layer chain

| Layer | File | Height / overflow / flex | Notes |
|-------|------|---------------------------|-------|
| `html` | `src/app/globals.css` (base) | no height; `overflow-y: visible` (BEFORE) | Document was a live scrollport |
| `body` | `src/app/globals.css` (base) | no height; `overflow-y: visible` (BEFORE) | Same; `overflow:hidden` still allows programmatic `scrollTop` |
| Root layout | `src/app/layout.tsx` | no viewport lock | Cookie banner / analytics siblings outside shell |
| Dashboard layout | `src/app/(dashboard)/layout.tsx` | `#dashboard-root.contents` | Marker for `:has()` lock; no box |
| Shell | `dashboard-shell.tsx` | BEFORE `h-screen overflow-hidden`; AFTER `h-dvh max-h-dvh min-h-0 overflow-hidden` | Viewport shell |
| Column | `dashboard-shell.tsx` | `min-h-0 flex-1 flex-col overflow-hidden` | OK |
| Topbar | `topbar.tsx` | `h-14/16 shrink-0 sticky` | Outside `#main-content` |
| Sidebar | `dashboard-sidebar.tsx` | `h-full` + AFTER `min-h-0` | Flex min-size safety |
| `#main-content` | `dashboard-sidebar.tsx` | `min-h-0 flex-1 overflow-y-auto`; AFTER `overscroll-y-contain` | Sole content scroller |
| Footer | `dashboard-shell.tsx` → `SiteFooter variant="minimal"` | **Inside** `#main-content` via `PageTransition` | Placement **A** — does not create root document height |
| PageTransition | `page-transition.tsx` | content-driven height | Inside main |

### Footer determination

**A — inside `#main-content`.** Confirmed in shell JSX and forensics (`footerInsideMain: true`). After html/body reset, footer was reachable at high `mainScrollTop` because it lives in the internal scrollport.

## Root cause (proven)

1. **Primary:** `html` / `body` had no authenticated viewport lock (`overflow-y: visible`, no fixed height). The app relied only on shell `h-screen overflow-hidden` + `#main-content overflow-y-auto`.
2. **Document remained a viable scrollport.** Any document overflow (sibling, UA chaining, focus/`scrollIntoView`, or programmatic `body.scrollTop`) translates the entire shell off-screen while `#main-content.scrollTop` stays independent.
3. **`#main-content` had `overscroll-behavior: auto`**, so boundary wheel events can chain to the document when the document is scrollable.
4. **`overflow: hidden` alone is insufficient** for body: it still creates a scroll container; programmatic `body.scrollTop` moves clipped content (main goes negative while `body.getBoundingClientRect().top` stays 0). Authenticated lock must use **`overflow: clip`**.

### Dual-scroll class proof (local, BEFORE lock)

Injected a 2000px body sibling (simulating document overflow), then `window.scrollTo(0,1423)`:

| Metric | Value |
|--------|-------|
| `htmlScrollTop` | **1423** |
| `bodyTop` | **−1423** |
| `mainTop` | **−1367** |
| `mainCH` | 844 |
| `mainST` (set) | **3533** |
| After html/body reset | `htmlScrollTop:0`, `mainST:3533`, `mainTop:56` |

Matches operator geometry class exactly.

## Fix (smallest structural correction)

1. **`src/app/globals.css`** — when `#dashboard-root` is present:
   - `html`: `height/max-height: 100dvh; overflow: clip`
   - `body`: `height/max-height: 100%; overflow: clip; overscroll-behavior: none`
   - Portal (`#portal-root`) intentionally excluded (document scroll shell)
2. **`dashboard-shell.tsx`** — `h-dvh max-h-dvh min-h-0 overflow-hidden`
3. **`dashboard-sidebar.tsx`** — sidebar `min-h-0`; `#main-content` `overscroll-y-contain`

**Not used:** `window.scrollTo` hacks, card overflow hacks, footer deletion, Operations redesign, density changes.

## Before / after numeric proof

### BEFORE (operator + dual-scroll class)

| | Operator | Local dual-scroll repro |
|--|----------|-------------------------|
| `html.scrollTop` | ≈1423 | 1423 |
| `mainRect.top` | ≈−1353 | −1367 |
| `body.top` | ≈−1423 | −1423 |
| `html/body overflow-y` | visible (architecture) | visible |
| `main` still scrollable | yes | yes |

### AFTER (local `next start`, overflow clip lock)

| | Dual-scroll inject+scrollTo | Width matrix (1660…768) after wheel past bottom |
|--|-----------------------------|--------------------------------------------------|
| `window.scrollY` | **0** | **0** |
| `html.scrollTop` | **0** | **0** |
| `body` rect top | **0** | **0** |
| `documentOverflowPx` | **0** (inject ignored) | **0** |
| `html/body overflow-y` | **clip** | **clip** |
| `mainRect.top` | **56** (≥0) | **56–64** |
| `main.scrollTop` | 3533 (internal OK) | up to max (internal OK) |
| Footer inside main | yes | yes |

## Regression E2E

New: `e2e/authenticated-document-scroll-ownership.spec.ts` (registered in `playwright.config.ts`)

- Widths 1660, 1024, 1000, 926, 768 ×900  
- Scroll `#main-content` to bottom + wheel beyond; assert window/html/body scroll 0; main in viewport; footer reachable  
- Top-boundary overscroll  
- Injected tall body sibling + forced document scroll must not move shell  
- Nav: dashboard → clients → settings → dashboard  
- Routes: `/dashboard` `/clients` `/reports` `/settings` `/sales` `/dashboard/compliance`

**Result:** 13/13 passed.

Related suites: `authenticated-nav-layout`, `dashboard-active-overview-scrollspace`, `dashboard-motion-wrapper-height` — **8/8 passed**.

## Validation

| Check | Result |
|-------|--------|
| `npm run typecheck` | pass |
| `npm run lint` | pass (pre-existing unused-var warnings only) |
| `npm run build` | pass |
| Scroll-ownership E2E | 13 passed |
| Related dashboard E2E | 8 passed |
| `npm run test:seo-godmode` | 9 passed |
| `npm run test:technical-seo` | 64 passed |

## Files changed

- `src/app/globals.css`
- `src/components/layout/dashboard-shell.tsx`
- `src/components/layout/dashboard-sidebar.tsx`
- `e2e/authenticated-document-scroll-ownership.spec.ts`
- `e2e/authenticated-nav-layout.spec.ts` (shell selector)
- `playwright.config.ts`
- `docs/p0-authenticated-document-scroll-leak-remediation.md`

## Git

- Local commit only (no push / no deploy)
- Message: `fix: prevent authenticated document scroll leakage`
