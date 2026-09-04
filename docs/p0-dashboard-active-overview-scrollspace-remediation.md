# P0 — Active Overview scrollspace / remaining production blank-space remediation

Date: 2026-09-04  
Branch: `main`  
Start HEAD: `2a08bd66f1977820bc695069b17e49d26b1ffc69` (inactive-tab mount fix present)  
Related: `docs/p0-production-dashboard-motion-wrapper-remediation.md`

## 1. Operator evidence (accepted)

Live `/dashboard` (operator):

| Metric | Value |
|--------|-------|
| `#main-content.clientHeight` | ≈841px |
| `#main-content.scrollHeight` | ≈6820px |
| `scrollTop` observed | ≈3533px |
| Active Overview tabpanel | `hidden=false`, `children=1`, `display=block`, **offsetHeight ≈2521px** |
| Intelligence / Automation / Governance | `hidden=true`, `children=0`, `display=none`, height 0 |

**Inactive-tab stacking is ruled out** for this remaining defect. Active-only mount (`data-ops-mount="active-only"`) is live and working.

## 2. Reproduction matrix (E2E account, www + local prod build)

| Viewport | lg? | Overview H | main SH | Notes |
|----------|-----|------------|---------|-------|
| 1660×900 | yes | **873** | **3767** | Healthy desktop (current production) |
| 1280×900 | yes | 936 | 3938 | Sidebar reduces content width |
| 1024×900 | yes | 1176 | 5011 | 3-col ops; cramped contentW≈704 |
| **1000×900** | **no** | **2413** | **6358** | **Matches operator band** |
| 900×900 | no | 2413 | 6358 | Same single-stack path |
| 768×900 | no | 2413 | 6358 | Same |
| 1000 + open details | no | 2413 | 8283 | Overview unchanged; exec expands |
| 1024 + open details | yes | 1176 | **6695** | Near operator SH without Overview=2521 |

Operator **Overview≈2521 / SH≈6820** with inactive `children=0` reproduces as the **sub-lg single-column Overview stack** (measured 2413 / 6358), not as desktop 1660 geometry. Variance (±welcome / plan upgrade card / font metrics) covers 2521 vs 2413 and 6820 vs 6358. At true 1660×900 on current production, SH is already 3767.

## 3. Full vertical geometry (1000×900 BEFORE fix — defect path)

Direct stack under `#main-content` → `.motion-page-enter` → `div.min-w-0.space-y-8` → page `div.space-y-6`:

| Section | Top | Bottom | Height | Meaningful? |
|---------|-----|--------|--------|-------------|
| Command Center hero | 24 | 272 | 248 | Yes |
| Executive intelligence | 296 | 2291 | **1995** | Yes (Priority+Portfolio stacked; CSC; brief) |
| Workspace pulse | 2315 | 2761 | 446 | Yes |
| Workspace guidance | 2785 | 3392 | 607 | Yes |
| Operations (upgrade + tabs + Overview) | 3416 | 6161 | **2745** | Yes — tall due to Overview stack |
| Footer | ~6161 | 6334 | ~173 | Yes |
| `#main-content.scrollHeight` | — | — | **6358** | — |
| **UNEXPLAINED_EXCESS** | — | — | **24px** | `padding-bottom` only |

## 4. Active Overview breakdown (1000×900 BEFORE — ≈2413px)

Top-level siblings inside `[data-operations-tab=overview] > .grid` (single column because `lg:grid-cols-12` inactive):

| # | Panel | Height | Source |
|---|-------|--------|--------|
| 1 | System health | 279 | `SystemHealthCard` |
| 2 | Client health | 445 | `DashboardHealthEngine` |
| 3 | Risks overview | 555 | `DashboardRisksOverview` (+ heatmap) |
| 4 | Reports overview | 401 | `DashboardReportsOverview` |
| 5 | Health distribution | 333 | `ClientHealthOverview` |
| 6 | Reports queue | 360 | `ReportsQueueCard` |
| | **Sum + gaps** | **≈2413** | `dashboard/page.tsx` Overview tab |

All six are legitimate mounted Overview content. Nested tall descendants (>250px) are parents+children of these panels — do not sum.

At 1660×900 the same six pack into **2 rows × 3** → Overview **873px**.

## 5. Why main ≈6820 while Overview ≈2521

`6820 ≠ Overview alone.` Approximate composition on defect path:

- Executive + hero + pulse + guidance ≈ 3300–3700px (Priority/Portfolio also `lg:`-only → stack below 1024)
- Operations chrome (title, Business upgrade, summary, tabs) ≈ 300px
- Overview stack ≈ 2400–2521px
- Footer + padding ≈ 200px  
→ **~6300–6800px**, matching operator SH without any inactive-tab content.

## 6. Visual-end vs DOM-end / blank pixel owner

| Marker | Defect path (1000×900) |
|--------|------------------------|
| VISUAL_CONTENT_END (operator mental model after CSC/exec) | ~2291px |
| DOM_CONTENT_END (last Overview panel) | 6161px |
| FOOTER_END | 6334px |
| MAIN_SCROLL_END | 6358px |
| UNEXPLAINED_EXCESS | **24px** |

At `scrollTop≈3533` (into Operations): `elementFromPoint` hits **Business upgrade card / Overview panel chrome**, not an empty spacer node.

**BLANK_PIXEL_OWNER:** `#main-content` / page `bg-background` navy showing around and between **real stacked Overview cards** and upgrade surfaces after the denser executive block. Not a trailing phantom region past the footer.

## 7. Root cause (proven)

**File:** `src/app/(dashboard)/dashboard/page.tsx`  
**Pattern:** Operations Overview (and sibling ops tabs) used `grid … lg:grid-cols-12` **without a `md:` multi-column stage**. Executive Priority/Portfolio used the same `lg:`-only 12-col grid.

Below the `lg` (1024px) viewport breakpoint — common with DevTools docked, split windows, zoom, or tablet widths — all six Overview panels **single-stack** to ~2413px and Executive Priority/Portfolio also stack, inflating `#main-content` to ~6358px (operator ~6820).

Inactive tabs remain unmounted (`children=0`) throughout.

Not caused by: SEO `8d662a1`, `PageTransition`, scrollTop, overflow masking, or re-mount of inactive ops tabs.

## 8. Fix (smallest structural)

1. Ops grids: `md:grid-cols-2 lg:grid-cols-12` (Overview, Intelligence, Automation, Governance via `opsPanelGrid`).
2. Executive Priority/Portfolio: `md:grid-cols-12` + `md:col-span-7/5`.
3. Workspace guidance grids: `md:grid-cols-12` + matching `md:col-span-*`.

No overflow hiding, no max-height clip, no scrollTop hacks, no feature deletion, no entitlement/billing/SEO changes.

## 9. Before / after (local `next start`, E2E account)

| Viewport | Overview BEFORE | Overview AFTER | SH BEFORE | SH AFTER |
|----------|-----------------|----------------|-----------|----------|
| 1660×900 | 873 | **873** | 3767 | **3767** |
| 1024×900 | 1176 | **1176** | 5011 | **5011** |
| **1000×900** | **2413** | **1396** | **6358** | **4880** |
| Excess after footer | 24–32 | **24–32** | — | — |

## 10. Regression test

`e2e/dashboard-active-overview-scrollspace.spec.ts` (registered in `playwright.config.ts`):

1. Active Overview single content root; inactive tabs height 0 / children 0  
2. Desktop 1660 ceilings + footer closes scroll; no main-background-only at maxScroll  
3. Mid 1000: Overview ≤1800 (fails on ~2521); SH ≤5200 (fails on ~6820); ≤4 Overview rows; section gaps ≤500; excess ≤96  

Also retained: `dashboard-motion-wrapper-height`, `dashboard-ux-density`.

## 11. Validation

| Check | Result |
|-------|--------|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (pre-existing unused-var warnings only) |
| `npm run build` | PASS |
| Playwright dashboard geometry suite (6) | PASS |
| `npm run test:seo-godmode` | PASS 9/9 |
| `npm run test:technical-seo` | PASS 64/64 |

## 12. Files changed

- `src/app/(dashboard)/dashboard/page.tsx` — md-stage grids  
- `e2e/dashboard-active-overview-scrollspace.spec.ts` — geometry regression  
- `playwright.config.ts` — register spec  
- `scripts/p0-active-overview-scrollspace-forensics.mjs` — forensics helper  
- `scripts/p0-overview-viewport-matrix.mjs` — viewport matrix helper  
- `docs/p0-dashboard-active-overview-scrollspace-remediation.md` — this report  

## 13. Git

Local commit only. **Do not push. Do not deploy.**

## 14. Final verdict

**P0_DASHBOARD_REMAINING_SCROLLSPACE_FIXED_READY_FOR_OPERATOR_REVIEW**

## A–E answers (objective checklist)

| Q | Answer |
|---|--------|
| A. Why Overview ≈2521 | Six Overview panels single-stacked below `lg` (~2413 measured; ≈2521 with account/variance) |
| B. Top-level sections | System health, Client health, Risks, Reports, Health distribution, Reports queue |
| C. Legitimate? | Yes — all intended Overview cards |
| D. Mechanism | Missing `md:` multi-col stage on `lg:grid-cols-12` ops/exec grids; not min-height/absolute/duplicate mount |
| E. Why main ≈6820 | Exec+pulse+guidance+ops chrome+Overview stack+footer ≈6.3–6.8k; Overview alone is only ~2.5k of that |
