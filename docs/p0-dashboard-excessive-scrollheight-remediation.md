# P0 — Excessive authenticated dashboard scrollHeight / trailing blank space

Date: 2026-09-04  
Branch: `main`  
Start HEAD: `cb580fab72c74020a5d37d7f1ecd5cf1bc85c4a8`  
Related prior report: `docs/p0-authenticated-navigation-layout-runtime-remediation.md`  
Accused SEO commit: `8d662a1` — **not related** (marketing/SEO sources only; no dashboard shell/page changes)

## REPRODUCED

**NO** — not as *unexplained* trailing scroll space beyond the last legitimate rendered dashboard content.

Operator-visible “very large blank navy after Customer Success Center” **was investigated with production numeric measurement**. What appears after CSC is additional legitimate dashboard sections (Get started → Operational metrics → Business performance → Operations → footer), not an empty spacer node past content end.

## MAIN CLIENT HEIGHT

**836px** (viewport 1660×900; topbar + shell leave `#main-content` at 836)

## MAIN SCROLL HEIGHT BEFORE

**8217px** (production `app` / `www` / apex hosts; light and dark — identical after settle)

## LAST LEGITIMATE CONTENT BOTTOM

**8185px** (authenticated `SiteFooter variant="minimal"` bottom edge inside `#main-content`)

Executive intelligence (includes Priority clients / Portfolio health / Customer Success Center) ends at **2813px**.  
Customer Success Center panel bottom ≈ **2045px**.  
Operations section: top **4051px**, bottom **8032px**, height **3981px**.

## UNEXPLAINED EXCESS BEFORE

**32px** (`scrollHeight − footerBottom = 8217 − 8185`)

This equals `#main-content` bottom padding (`lg:py-8` → 32px). **EXCESS ≤ 100px threshold — no unexplained owner required by the mission stop condition.**

For contrast (operator perception framing, not unexplained DOM void):

| Boundary | Bottom | `scrollHeight − boundary` |
|----------|--------|---------------------------|
| CSC panel | ~2045 | ~6172px of *later sections* |
| Executive intelligence section | 2813 | **5404px** of later sections |
| Operations section | 8032 | ~185px (footer + gaps) |
| Footer | 8185 | **32px** (padding only) |

## EXACT ELEMENT OWNING EXCESS

**None beyond padding.** The only post-content pixels are `#main-content` padding-bottom.

The large scrollable distance the operator observes after CSC is owned by **real rendered sections**, primarily:

**`<section aria-label="Operations">`** inside `src/app/(dashboard)/dashboard/page.tsx`  
(~3981px), plus Workspace guidance / Operational metrics / Business performance (~1200px combined).

Within Operations, CSS grid row height tracks the tallest panel in each row (e.g. Platform status ~829px), so shorter siblings leave **in-row navy gutters** under shorter cards (measured up to **509px** wasted below “System health” in the same row). That is visible blank *inside* content height, not scrollHeight inflation past the footer. Neutralizing `align-items` / `align-self` did **not** change `scrollHeight` (row track size unchanged).

## EXACT COMPONENT

- Page: `DashboardPage` (`src/app/(dashboard)/dashboard/page.tsx`)
- Shell scrollport: `DashboardMain` → `#main-content.dashboard-main`
- Transition wrapper: `PageTransition` (`motion-page-enter mx-auto w-full max-w-7xl space-y-8`)
- Footer: `SiteFooter variant="minimal"` (inside `DashboardShell`, inside `#main-content`)

## EXACT FILE

- `src/app/(dashboard)/dashboard/page.tsx` — dense always-on Operations / executive panel grid
- `src/components/layout/dashboard-shell.tsx` — `h-screen` shell; scroll on `#main-content`
- `src/components/layout/dashboard-sidebar.tsx` — `#main-content` scroll owner

## EXACT CSS / LAYOUT RULE

- Authenticated scroll owner: `#main-content.dashboard-main` with `overflow-y-auto` (window `scrollY` stays 0)
- Shell: `flex h-screen overflow-hidden`
- Main padding: `py-6 lg:py-8` → **32px** trailing padding (= measured excess)
- Dashboard panels: many `className="min-h-[320px]"` (and 280/360) tokens from Phase 12; on live production computed `min-height` was **not** the height driver (content already ≥ those floors). Height is content + grid row packing.
- Dark blank paint: `html.dark { --color-background: #07101f }` on `#main-content` / surfaces — not marketing-theme leakage (`marketing-theme` count = 0 on all hosts)

## ORIGINATING COMMIT

Dashboard executive/operations density with `min-h-[…​]` panels originated in:

**`feaedf40`** — *Phase 12 Enterprise Intelligence Dashboard* (2026-07-08)

Subsequent phases added more Operations cards (automation, predictive, compliance, platform status, etc.), growing scrollHeight further. Not introduced by the Sep 2026 SEO commit.

## SEO COMMIT RELATED

**NO**

`8d662a1` touches marketing/SEO modules only (`src/lib/seo/**`, marketing pages). Zero authenticated shell / dashboard page paths.

## ROOT CAUSE

**No rogue empty node, spacer, marketing footer megabar, Framer exit layer, or scrollHeight inflation past the last content edge was found on production.**

`#main-content.scrollHeight ≈ 8217` **closely matches** the stacked height of Command Center + Executive intelligence + guidance + metrics + business + Operations (~20 panels) + minimal footer + 32px padding.

Operator screenshots that stop mentally at Customer Success Center still have **~5.4kpx** of legitimate later dashboard UI remaining — sparse/zero-data Operations cards on dark navy read as “trailing blank,” and the scrollbar correctly shows remaining travel.

Hosts compared (same metrics): `app.auroranexis.com`, `www.auroranexis.com`, `auroranexis.com` (apex → www). Dark vs light: same scroll geometry after settle.

## FIX

**No height-structure product fix shipped** — unexplained excess was not present to eliminate.

Removed unjustified speculative behavior from prior defensive pass (`cb580fa`):

- Deleted `DashboardMain` pathname `useLayoutEffect` `scrollTop = 0` reset (does not address scrollHeight; scroll-retention blank was not reproduced as the primary defect here; loading shells already collapse height and clamp scrollTop on soft nav).

Added structural E2E: trailing gap past last legitimate content (footer / last section) must stay ≤ **96px**.

## MAIN SCROLL HEIGHT AFTER

**8217px** (unchanged — no height bug to remove)

## UNEXPLAINED EXCESS AFTER

**32px** (padding only; within tolerance)

## EMPTY WORKSPACE TEST

**PASS (partial)** — production E2E tenant is low/zero-activity on many widgets (0 risks/incidents/connectors, sparse metrics) with scrollHeight still equal to content+padding. True brand-new 0-client org not separately seeded; executive+operations still mount for owner role with plan entitlements.

## POPULATED WORKSPACE TEST

**PASS** — same tenant has clients/reports activity in executive surfaces; trailing excess still 32px.

## SIDEBAR NAV TEST

**PASS** (prior forensics + retained e2e matrix). ScrollHeight defect is independent of soft-nav scrollTop.

## TYPECHECK / LINT / BUILD / SEO TESTS / E2E

| Check | Result |
|-------|--------|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (pre-existing unused-var warnings only) |
| `npm run build` | PASS |
| `npm run test:seo-godmode` | PASS (9/9) |
| `npm run test:technical-seo` | PASS (64/64) |
| `e2e/authenticated-nav-layout.spec.ts` (setup + chromium-auth) | PASS (5/5) including new trailing-gap assertion |

## LOCAL COMMIT

Branch tip message: `docs: p0 dashboard scrollheight forensics — no unexplained trailing excess`  
(`git log -1 --oneline` on local `main`; **not pushed**; sits atop `cb580fa` / `2f4b6f3`)

## FINAL VERDICT

**P0_EXCESSIVE_DASHBOARD_SCROLLSPACE_NOT_REPRODUCED**

### Evidence artifacts

- `.recert-evidence/p0-scrollheight-forensics.mjs`
- `.recert-evidence/p0-scrollheight-hosts.mjs` / `p0-scrollheight-hosts.json`
- `.recert-evidence/p0-scrollheight-binary.mjs` / `p0-scrollheight-binary.json`
- `.recert-evidence/p0-grid-stretch-forensics.mjs` / `p0-grid-stretch.json`
- Screenshots: `p0-hosts-bottom-*.png`, `p0-hosts-midops-*.png`, `p0-scrollheight-bottom-*.png`

### Optional product follow-up (out of P0 scope — not a proven height bug)

If operators want a shorter empty-state dashboard, that is a **content-density** change (collapse empty Operations cards / reduce always-on panels), not a layout void fix. Do not use `overflow:hidden` / max-height clipping.
