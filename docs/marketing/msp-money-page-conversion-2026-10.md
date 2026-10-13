# MSP Money Page Conversion Sprint 01

**Date:** 2026-10-13  
**Primary URL:** `/use-cases/msps`  
**Secondary:** `/contact#demo` (anchor only)  
**Mode:** Strictly scoped implementation  
**Push / deploy:** Not performed

---

## 1. Objective & scope

Turn the existing `/use-cases/msps` page into a credible high-intent MSP acquisition surface optimized for qualified demo requests and legitimate self-serve registration — not vanity traffic.

**In scope:** MSP use-case content + CTA hierarchy, contact demo anchor reliability, focused SEO metadata via existing landing registry, focused regression test, this report.  
**Out of scope:** Homepage redesign, VDP changes, billing/auth/RLS/API, new MSP routes, fabricated social proof, ads, sitewide robots/sitemap/routing.

---

## 2. Audit alignment (go / no-go)

Source: `docs/seo/organic-revenue-forensic-audit-2026-10.md`

| Audit statement | Implication |
|-----------------|-------------|
| **NOT READY FOR ORGANIC REVENUE RELIANCE — READY FOR FOCUSED MONEY-PAGE EXECUTION** | Proceed with money-page sprint |
| `/use-cases/msps` = Primary ICP, Critical commercial, P0 improve | MSP-first is correct |
| Proposed title: “MSP Client Portfolio Management Software \| Auroranexis” | Already aligned; preserved |
| VDP remains indexed | Untouched |
| Strengthen existing owners; do not create parallel URLs | No new MSP route |

**Verdict:** Audit does **not** contradict MSP-first execution. Highest-priority alternative would only apply if MSP were demoted; it is not.

---

## 3. Sales intent (Execution A)

| Element | Implementation |
|---------|----------------|
| **WHO** | MSP owners, service delivery managers, account leads (boutique → regional) |
| **Pain** | Fragmented portfolio status; stale PSA exports; inconsistent risk/incident/SLA context; QBR burden |
| **Fit** | Health/CS signals; Business+ incidents/risk/SLA; reporting + portal; profitability context |
| **Gains** | Shared visibility; auditable operational/SLA records; consistent portal/reporting cadence; clear plan path |
| **Gates** | Professional ≤25 clients (portal, WL, reporting, profitability, automation builder); Business ≤100 + risk/incident/SLA/escalation/automation engine; Enterprise custom limits + onboarding/priority support |
| **Next action** | Book MSP demo → compare plans → create workspace; Pilot Partner invite-only |

Claims verified against `src/lib/plans/features.ts` and public plan copy — no invented ROI, customers, logos, certifications, trials, or guarantees.

---

## 4. Above-the-fold & CTA hierarchy (Execution B)

| Priority | Label | Target |
|----------|-------|--------|
| Primary | Book an MSP demo | `/contact#demo` (`bookMspDemo` preset → existing `DemoBookingForm`) |
| Secondary | Compare plans | `/pricing` |
| Tertiary (accessible signup) | Create workspace | `/signup` |
| Related | Pilot Partner (invite-only) | `/pilot-program` |

Hero uses primary + secondary. Bottom CTA band uses all three. Contact demo section now has `id="demo"` (no form logic change). Existing consent-gated `demo_requested` / `pricing_view` / `signup_started` events reused — no new measurement stack.

---

## 5. Content & trust (Execution C)

- Reduced generic “command center” framing; concrete MSP workflow steps from live modules only.
- Plan entitlements tightened to Professional / Business / Enterprise limits and feature gates.
- Pilot Partner mentioned only as invite-only evaluation path.
- Related links mesh to health, SLA, incident, risk, reporting, profitability, portal, pricing, signup, pilot.
- No testimonials, logos, screenshots, fabricated case studies, or misleading schema additions.

---

## 6. Technical SEO (Execution D)

| Check | Result |
|-------|--------|
| Canonical path | Remains `/use-cases/msps` via `buildLandingPage` + `createPageMetadataForPath` |
| Title / H1 | “MSP Client Portfolio Management Software” |
| Meta | MSP portfolio / health / SLA / incidents / risk / reporting / portal |
| Indexable | Still `public_website` / sitemap-listed use-case slug |
| Intent owner | `msp-operations-persona` → `USE_CASE_ROUTES.msps` unchanged |
| VDP / robots / sitemap / redirects | Not modified |
| Doorway / FAQ stuffing / fake AggregateRating | Not introduced |

---

## 7. CTA route evidence (Execution E)

| CTA | Route | Verified mechanism |
|-----|-------|--------------------|
| Book an MSP demo | `/contact#demo` | `MARKETING_CTA_PRESETS.bookMspDemo` + contact `MarketingSection id="demo"` + `DemoBookingForm` |
| Compare plans | `/pricing` | `comparePlans` preset |
| Create workspace | `/signup` | `startFreeTrial` tertiary + related link |
| Pilot Partner | `/pilot-program` | Related link only |
| Forms submitted | — | **Not performed** (per brief) |

Authenticated remap treats `/contact#*` like contact (support path) so demo deep-links do not strand logged-in users on a hidden demo form.

---

## 8. Validation evidence

| Check | Result |
|-------|--------|
| `scripts/msp-money-page-conversion.test.mjs` | **PASS** (2/2) |
| `scripts/seo-godmode.test.mjs` + `scripts/technical-seo.test.mjs` + phase-31 landing | **PASS** |
| `scripts/claim-to-code-truth.test.mjs` MSP honesty (`msps does not promise…`) | **PASS** |
| Unrelated claim test `homepage and about avoid ROI…` | **FAIL pre-existing** — expects homepage string `Document value`; homepage currently has `document operational outcomes` only. **Not introduced by this sprint** (homepage not modified). |
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** |
| `npm run build` | **PASS** — `/use-cases/msps` in SSG output |
| `git diff --check` | Run before commit |
| Unrelated working-tree files | Left untouched (pre-existing dirty tree preserved) |

---

## 9. KPI baselines

| KPI | Baseline |
|-----|----------|
| Organic clicks to `/use-cases/msps` (ex-VDP) | unknown |
| Demo requests attributed to MSP page | unknown |
| Signup starts from MSP page | unknown |
| Pricing views from MSP page | unknown |
| Qualified pipeline from MSP page | unknown |

Measurement note: CTA presets already emit consent-compatible `demo_requested`, `pricing_view`, and `signup_started`. Funnel attribution by landing path remains a future analytics instrumentation task if product analytics does not already segment by `source` / `surface`.

---

## 10. Operator next actions

1. Review copy + CTA destinations on staging/production preview for `/use-cases/msps` and `/contact#demo`.
2. Deploy when ready (this sprint does not push/deploy).
3. In GSC, watch commercial queries (`managed services portfolio`, MSP software variants) separately from VDP.
4. Optionally wire dashboard filters on `demo_requested` where `source=msp_use_case` / `surface=use_cases_msps`.
5. Do **not** noindex VDP; do **not** expand URL sprawl before this money page earns CTR learning.

---

*End of MSP Money Page Conversion Sprint 01 report.*
