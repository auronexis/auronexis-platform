# P0 — Production dashboard motion wrapper blank space remediation

Date: 2026-09-04  
Branch: `main`  
Start HEAD: `ae65aa761780e3fd467d4899bd00b2c2818babaa`  
Related: `docs/dashboard-ux-density-remediation-2026-09.md`, `docs/p0-dashboard-excessive-scrollheight-remediation.md`

## PRODUCTION DEFECT CONFIRMED

**YES**

Operator Chrome DevTools on live `/dashboard`:

| Metric | Operator production |
|--------|---------------------|
| `#main-content.clientHeight` | 841px |
| `#main-content.scrollHeight` | **6820px** |
| `#main-content.scrollTop` | 0 |
| `#main-content.childCount` | 1 |
| `.motion-page-enter` height | **~6760px** |
| Nested wrapper height | **~6544px** |
| Command Center bottom | ~740px |
| Executive intelligence bottom | ~2256px |

Huge navy blank after legitimate above-the-fold executive content while `#main-content` continued to scroll.

## PRIOR FORENSICS CORRECTION

Earlier report `docs/p0-dashboard-excessive-scrollheight-remediation.md` concluded `P0_EXCESSIVE_DASHBOARD_SCROLLSPACE_NOT_REPRODUCED` and framed post-CSC navy as “later legitimate sections.”

That framing is **insufficient** for this defect:

1. Operator measured ~6820px with a tall `.motion-page-enter` wrapper — not merely “perception.”
2. Reproducing the broken geometry numerically: forcing inactive Operations Center tabpanels into layout on live production raised `#main-content.scrollHeight` **3767 → 6879** and motion height **3703 → 6815** — matching operator ~6820 / ~6760 within variance.
3. The blank region is therefore **abnormal stacked Operations markup** inside the page/motion wrapper, not intentional executive chrome.

Local/E2E that looked “correct” measured the healthy path where HTML `hidden` + Tailwind `[hidden]{display:none!important}` collapsed inactive panels — it did **not** prove the latent mount of all four ops trees was safe.

## SOURCE TRACE (wrapper chain)

| Layer | File:line | Class / id | display | position | height | min-height | flex | overflow | transform | animation |
|-------|-----------|------------|---------|----------|--------|------------|------|----------|-----------|-----------|
| Scrollport | `dashboard-sidebar.tsx` `DashboardMain` ~64–72 | `#main-content.dashboard-main` | block | static | client≈836 | 0 | `1 1 0%` | `hidden auto` / `overflow-y:auto` | none | none |
| Page / motion wrapper | `page-transition.tsx` ~14–21 | `motion-page-enter mx-auto w-full max-w-7xl space-y-8 min-w-0` | block | static | content | 0 | `0 1 auto` | visible | none | `aurora-page-enter` 150ms opacity only (`both`) |
| Nested content + footer host | `dashboard-shell.tsx` ~69–71 | `min-w-0 space-y-8` | block | static | content | 0 | auto | visible | none | none |
| Dashboard page root | `dashboard/page.tsx` ~273 | `space-y-6` | block | static | content | 0 | auto | visible | none | none |
| Height inflater (broken) | `operations-center.tsx` (pre-fix) | `[data-operations-center] [role=tabpanel]` ×4 | inactive should be `none`; when not, `block` | static | sum ≈ +3112px | 0 | auto | visible | none | none |

**No Framer Motion / AnimatePresence / layoutId.** Motion is CSS class `motion-page-enter` only (`src/lib/ui/motion.ts`, `globals.css` `@keyframes aurora-page-enter` opacity 0→1).

`PageTransition` does **not** invent height (no min-height, no absolute exit layer, no layout animation). It **reflects** descendant height. DevTools “deepest visible” hit on `motion-pag…` is expected for a tall content wrapper.

## LOWEST HEIGHT-OWNING ELEMENT

**Broken state:** inactive `OperationsCenter` tabpanels that still mounted full `tab.content` trees (Intelligence + Automation + Governance ≈ +3.1kpx). When those nodes participate in layout, they are the lowest owners of the abnormal excess; the motion wrapper merely sums them.

**Numeric proof (live production, E2E account, force-unhide inactive panels):**

| | scrollHeight | motion offsetHeight |
|--|--------------|---------------------|
| Normal (hidden works) | 3767 | 3703 |
| Force `hidden=false` + `display:block` on all tabpanels | **6879** | **6815** |
| Delta | **+3112** | **+3112** |

Operator ~6820 / ~6760 ≈ this forced-broken geometry (welcome/empty account variance ±tens–hundreds).

**After fix (local `next start`):** inactive panels `childElementCount=0`; force-unhide delta **0**; SH stays **3767**.

## ROOT CAUSE

`OperationsCenter` (introduced in density commit `ae65aa7`) kept **all four tab content trees mounted** and relied on the HTML `hidden` attribute alone to remove them from layout.

That is fragile:

- When `hidden` / `display:none` applies → SH ≈ 3767 (looks fixed).
- When inactive panels remain in flow (attribute/CSS failure, tooling, intermittent UA behavior, or operator measurement of stacked trees) → SH ≈ **6820** and `.motion-page-enter` ≈ **6760**.

Density remediation compressed the *default* path but left this **latent blank-space bomb** inside the motion/page wrapper.

## WHY LOCALHOST LOOKED CORRECT WHILE PRODUCTION LOOKED BROKEN

| Factor | Effect |
|--------|--------|
| Local/E2E with working `[hidden]{display:none!important}` | Inactive panels height 0 → SH 3767; defect not visible |
| Operator production DOM | Measured ~6820 — equivalent to all ops tabs in flow |
| Live production (same E2E user, hidden working) | Also 3767 — but force-unhide instantly recreates ~6879 |
| Welcome / empty workspace | Adds welcome + expanded guidance; not required to hit ~6820 — stacked inactive ops trees are sufficient |
| SEO commit `8d662a1` | Unrelated |
| `PageTransition` / soft nav A–E | Hard load, sidebar round-trip, back/forward, reload all keep SH 3767 when hidden works; motion does not retain prior route height |

## CLIENT NAV MATRIX (local production build, post-fix)

All cases: `#main-content.scrollHeight=3767`, motion≈3703, inactive ops kids=0, unexplained after footer=32px.

- A hard load `/dashboard`
- B sidebar other→dashboard
- C dashboard→other→dashboard
- D back/forward
- E hard reload

## FIX

**Smallest correct fix:** do not mount inactive tab content.

File: `src/components/dashboard/operations-center.tsx`

- Keep tablist + empty `role="tabpanel"` shells for a11y.
- Render `{selected ? tab.content : null}`.
- Belt-and-suspenders: `hidden={!selected}` + Tailwind `hidden` class when inactive.
- Fingerprint: `data-ops-mount="active-only"`.

No overflow masking, no max-height, no scrollTop hacks, no Framer removal, no section deletion, no UX redesign of cards.

## MAIN SCROLL HEIGHT BEFORE / AFTER

| | Value |
|--|-------|
| Operator / broken geometry BEFORE | **~6820** (`#main-content`); motion **~6760** |
| Force-unhide reproduction BEFORE | **6879** / motion **6815** |
| Healthy path BEFORE (hidden OK) | 3767 / 3703 |
| AFTER fix (local prod build) | **3767** / **3703** |
| Force-unhide AFTER fix | **3767** (delta **0**) |

## UNEXPLAINED EXCESS AFTER

**32px** (`#main-content` `lg:py-8` padding) — within tolerance.

## SEO RELATED

**NO** — authenticated dashboard shell / Operations Center only. `8d662a1` not involved.

## DENSITY REMEDIATION RELATED

**YES (causal lineage, not false blame)** — `ae65aa7` introduced `OperationsCenter` that mounted all tab trees behind `hidden`. Density correctly cut default SH 8217→3767 when `hidden` works, but left the latent stacked-content defect that matches operator ~6820 when inactive trees re-enter layout. This commit hardens that component; it does not re-litigate card density.

## ORIGINATING COMMIT

- Motion class / `PageTransition`: `5db1fe2` (long-standing; reflector only).
- Offending mount pattern: **`ae65aa7`** `OperationsCenter` “all content mounted + hidden”.

## VALIDATION

- `npm run typecheck` — pass
- `npm run lint` — pass (pre-existing warnings only)
- `npm run build` + `next start :3005` — pass
- Force-unhide verify — PASS (`deltaSH=0`, `data-ops-mount=active-only`)
- Playwright `dashboard-motion-wrapper-height` + `dashboard-ux-density` — 4 passed
- `npm run test:seo-godmode` — 9 passed
- `npm run test:technical-seo` — 64 passed

## FILES CHANGED

- `src/components/dashboard/operations-center.tsx` — unmount inactive tab content
- `e2e/dashboard-motion-wrapper-height.spec.ts` — regression (forced-unhide must not recreate ~6820)
- `e2e/dashboard-ux-density.spec.ts` — assert inactive `childCount===0`
- `playwright.config.ts` — register new spec
- `scripts/p0-motion-wrapper-height-forensics.mjs` — measurement helper
- `scripts/p0-motion-wrapper-after-fix-verify.mjs` — post-fix verify
- `docs/p0-production-dashboard-motion-wrapper-remediation.md` — this report

## GIT

Local commit only — **DO NOT PUSH / DO NOT DEPLOY** from this chapter of work.

## VERDICT

**P0_PRODUCTION_DASHBOARD_BLANKSPACE_FIXED_READY_FOR_OPERATOR_REVIEW**
