# Dashboard UX Density Remediation — 2026-09

**Verdict:** `DASHBOARD_UX_DENSITY_FIXED_READY_FOR_OPERATOR_REVIEW`  
**Date:** 2026-09-04  
**Branch:** `main`  
**Baseline HEAD before UX commit:** `e9c9f57`

---

## 1. Executive verdict

The dashboard was structurally valid but UX-dense (~9–10 desktop viewports). Primary contributor was the always-expanded Operations wall (~3981px). Progressive disclosure (Operations Center tabs + collapsed secondary executive / guidance panels), compact Customer Success KPIs, and compact empty states cut `#main-content.scrollHeight` from **8217px → 3767px** at 1660×900 (−54%), with Operations **3981px → 1205px** (−70%). All product capabilities remain reachable in ≤2 interactions. No business logic, Mollie, RLS, SEO, or scrollTop-reset changes.

---

## 2. Before / after metrics (1660×900, authenticated local `next start :3005`)

| Metric | Before (prod forensics) | After (local measure) |
|--------|-------------------------|------------------------|
| `#main-content` clientHeight | 836 | 836 |
| `#main-content` scrollHeight | 8217 | **3767** |
| Content bottom | 8185 | 3735 |
| Operations section height | ~3981 | **1205** |
| Active ops tab (default) | n/a (all expanded) | `overview` |
| Unexplained trailing excess | 32px | within ≤96px tolerance |
| Preferred band 2500–3500 | miss | slightly above preferred, **under 4000 ceiling** |
| Height reduction | — | **54.2%** scrollHeight / **69.7%** Operations |

Evidence: `.recert-evidence/p0-scrollheight-1660x900.json` (before), `.recert-evidence/dashboard-ux-density-1660x900.json` (after).

---

## 3. Phase 1 inventory (rendered order, pre-change)

| Section | Height (approx) | Priority | Empty-state cost | Recommended treatment |
|---------|-----------------|----------|------------------|------------------------|
| Command Center Hero | 161 | L1 | Low | Keep |
| Executive Brief | 348 | L1 | Medium | Keep / slight compact |
| Priority clients | min-h 320 | L1 | High EmptyState | Keep prominent; compact empty; drop min-h |
| Portfolio health | min-h 320 | L1 | High | Same |
| Executive insights | min-h 280 | L2 | Medium | Collapse (details) |
| Customer Success Center | min-h 280 + large cards | L1 | Medium | Compact KPI grid |
| Health trends | min-h 280 | L2 | High | Collapse (details) |
| Smart timeline | min-h 360 | L2 | High | Collapse (details) |
| Workspace guidance / Quick actions | 674 | L2 setup | Medium | Compact; collapse when activated |
| Operational metrics | 218 | L2 | Low | Compact metric cards |
| Business performance | 218 | L2 | Low | Compact metric cards |
| **Operations (all panels)** | **3981** | L2/L3 | **Critical** | **Tabbed Operations Center** |
| FOOTER | 113 | — | — | Unchanged |

Executive intelligence block total was ~2588px; Operations ~3981px.

---

## 4. Information architecture (after)

**L1 — always visible (executive control center)**  
1. Command Center Hero  
2. Executive Brief (health / risk / opportunity signals)  
3. Customer Success Center (compact 6-KPI row)  
4. Priority clients + Portfolio health  

**L1.5 — pulse**  
5. Workspace pulse (operational + business metric rows, compact)

**L2 — progressive**  
6. Get started / guidance — full when activation/risk critical; otherwise collapsed details; recommendations collapsed by default when activation active  
7. Operations Center — summary strip + tabs (Overview / Intelligence / Automation / Governance)

**L3 — expand on demand**  
8. “More executive intelligence” `<details>` → insights, health trends, smart timeline  
9. Non-default Operations tabs  

Desktop ideal: V1 executive+CSC+priority; V2 pulse+guidance summary; V3 ops overview (~3–4.5 viewports at 900px, not 8–10).

---

## 5. Operations redesign

- New client component: `src/components/dashboard/operations-center.tsx`
- Pattern: accessible `role="tablist"` / `tab` / `tabpanel`, keyboard arrows, badges for urgent counts
- Inactive panels use HTML `hidden` (`display: none`) — **not unmounted** — so features stay in tree and reachable without remount bugs
- Default tab: **Overview** (system/client health, risks, reports, queue, alerts)
- Secondary: Intelligence, Automation, Governance (platform, compliance, SLA, escalation, activity, etc.)
- Empty / zero-item modules no longer force stacked `min-h-[320px]` canvases across 20+ panels

---

## 6. Empty workspace behaviour

- `EmptyState` gained `density="compact"` (~10rem–16rem)
- Priority clients, portfolio health, health trends, smart timeline use compact density
- Executive brief empty + CSC empty shortened
- Dashboard panels **removed** blanket `min-h-[320|360|280px]` forcing empty canvases
- Target empty panel footprint ~180–260px (validated by E2E: dashed empties ≤320px)

---

## 7. Customer Success Center

- Replaced large vertical cards (label + description + count) with **compact 2×3 / 6-col KPI tiles**
- Descriptions preserved via `title` + `Tooltip` + `aria-label`
- Links and category semantics unchanged

---

## 8. Features preserved (checklist)

| Feature | Preserved |
|---------|-----------|
| Priority Clients | Yes |
| Portfolio Health | Yes |
| CSC metrics (all categories, clickable) | Yes |
| Executive Brief + AI brief link | Yes |
| Executive insights / health trends / timeline | Yes (details) |
| Operational + business metrics | Yes |
| Quick actions (all 6) | Yes |
| Activation / adoption / CS / EI guidance | Yes |
| Smart recommendations | Yes |
| System health, client health, risks, reports, queue, alerts | Yes (Overview) |
| AI Insights, CS hub, ops tasks, predictive, exec reports, incident/risk AI | Yes (Intelligence) |
| Automation, integrations, runtime, knowledge, monitoring | Yes (Automation) |
| Platform status, compliance, SLA, escalation, activity | Yes (Governance) |
| Business upgrade card | Yes |
| Sidebar navigation | Yes |
| Mollie / RLS / auth / SEO | Untouched |

**Features preserved: YES**

---

## 9. Files changed

- `src/app/(dashboard)/dashboard/page.tsx` — IA reorder + OperationsCenter wiring
- `src/components/dashboard/operations-center.tsx` — **new**
- `src/components/dashboard/customer-success-center.tsx`
- `src/components/dashboard/dashboard-panel.tsx` — compact metric size
- `src/components/dashboard/dashboard-quick-actions.tsx` — compact mode
- `src/components/dashboard/executive-brief.tsx`
- `src/components/dashboard/priority-clients-panel.tsx`
- `src/components/dashboard/portfolio-health-distribution.tsx`
- `src/components/dashboard/health-trends-panel.tsx`
- `src/components/dashboard/smart-timeline-panel.tsx`
- `src/components/ui/empty-state.tsx` — `density="compact"`
- `e2e/dashboard-ux-density.spec.ts` — **new**
- `e2e/authenticated-nav-layout.spec.ts` — scrollHeight wait + soft-nav residual tolerance
- `playwright.config.ts` — include density spec
- `scripts/dashboard-ux-density.test.mjs` — **new** source contracts
- `scripts/dashboard-ux-density-measure.mjs` — **new** measurement helper
- `docs/dashboard-ux-density-remediation-2026-09.md` — this report

---

## 10. Forensic commits cleanup decision (2f4b6f3, cb580fa, e9c9f57)

| Commit | Nature | Keep? |
|--------|--------|-------|
| `2f4b6f3` test: lock marketing shell out of authenticated app shell | Permanent regression protection (source + docs) | **Keep** |
| `cb580fa` docs: authenticated navigation layout incident forensics | Docs + E2E + forensic scripts; sidebar scrollTop reset landed then removed later | **Keep history**; useful E2E/matrix |
| `e9c9f57` docs: p0 dashboard scrollheight forensics | Docs + trailing-gap E2E; **removed** speculative pathname `scrollTop` reset | **Keep**; do **not** reintroduce scrollTop reset |

**Cleanup decision:** Leave prior three commits as additive history. This remediation is **one additional commit** on top. Soft-nav residual ≤48px accepted as structural health without reintroducing scrollTop reset. Trailing-gap E2E retained and still passing.

---

## 11. Height reduction %

- scrollHeight: \(8217 - 3767\) / 8217 = **54.2%**
- Operations: \(3981 - 1205\) / 3981 = **69.7%**

---

## 12. Desktop viewport matrix (authenticated local)

| Viewport | clientHeight | scrollHeight | opsHeight | Ceiling OK |
|----------|--------------|--------------|-----------|------------|
| 1280×800 | 736 | 3938 | 1268 | Yes (≤4000) |
| 1440×900 | 836 | 3835 | 1225 | Yes |
| 1660×900 | 836 | **3767** | **1205** | Yes |
| 1920×1080 | 1016 | 3767 | 1205 | Yes |

---

## 13. Mobile / tablet

- Ops tabs: `min-h-10`, wrap, touch-friendly
- CSC: 2-col → 3-col → 6-col progressive
- Quick actions compact: 2/3/6 cols
- Native `<details>` summaries usable on touch
- Metric cards compact; no horizontal-only reliance for critical L1 content

---

## 14. Validation gates

| Gate | Result |
|------|--------|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass (pre-existing warnings only) |
| `npm run build` | Pass |
| `npm run test:seo-godmode` | Pass (9) |
| `npm run test:technical-seo` | Pass (64) |
| `node --test scripts/dashboard-ux-density.test.mjs` (+ related) | Pass |
| Playwright `dashboard-ux-density` + `authenticated-nav-layout` | **7 passed** |

---

## 15. Local commit

- Message: `ux: compact dashboard operations and empty-state density`
- Push / deploy: **not performed** (operator review)

---

## FINAL VERDICT

**DASHBOARD_UX_DENSITY_FIXED_READY_FOR_OPERATOR_REVIEW**
