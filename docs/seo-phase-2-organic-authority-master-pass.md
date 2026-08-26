# SEO Phase 2 — Organic Authority + Search Demand Architecture

**Date:** 2026-08-26  
**Branch:** `main`  
**Frozen baseline:** `d4cff226f87696169450a3785e324edf2874e666` (`chore: finalize SEO integrity and eradicate legacy billing providers`)  
**Prior report:** `docs/final-production-seo-legacy-billing-eradication.md`  
**Working tree at start:** clean (no unrelated dirty changes)  
**Production:** https://www.auroranexis.com · App: https://app.auroranexis.com  
**Billing truth:** Auroranexis control plane + Mollie PSP · EUR · LIVE charging unchanged  

---

## 1. VERDICT

**READY_FOR_OPERATOR_REVIEW**

Architecture-first organic authority pass completed without mass page generation. Confirmed homepage heading duplication fixed; industry↔use-case and feature↔solution cannibalization differentiated; intent ownership expanded; strategic internal links tightened. No invented claims, no Product/Merchant regression, no legacy billing reactivation, no push/deploy/LIVE charge.

---

## 2. Scope and change control

| Rule | Status |
|------|--------|
| Read-only forensics first | PASS — clean tree at baseline |
| Not mass page generation | PASS — 0 new public URLs |
| Not visual redesign | PASS |
| Not Mollie/LIVE billing changes | PASS |
| P0/P1 only for code | PASS |
| Editorial roadmap documented; foundational pieces only if necessary | PASS — architecture first; 0 new articles |
| No translations | PASS |
| No push | PASS |

---

## 3. Forensic method

Mapped: git state, prior SEO report, `PAGE_SEO` / sitemap / robots / metadata / SoftwareApplication JSON-LD, marketing hubs (features, solutions, use-cases, industries, resources, templates), nav/footer, pricing EUR, internal links, product truth from dashboard modules + `src/lib/**` services.

---

## 4. Product truth (evidence-backed)

Auroranexis is a multi-tenant **Operations Command Center** for agencies/MSPs: clients, health, risks, incidents, monitoring, SLA, reports, client portal, automation, AI assist (human review), profitability, customer success. Public plans EUR via Mollie (Professional / Business / Enterprise). Not SOC2/ISO certified; readiness language only. Testimonials are representative priorities, not named customers.

---

## 5. Public URL inventory

| Bucket | Count |
|--------|------:|
| Marketing hubs | 22 |
| Legal | 9 |
| Features | 15 |
| Use-cases | 9 |
| Industries | 9 |
| Solutions | 6 |
| Templates | 5 |
| Docs hub + release notes | 2 |
| Doc pages | 21 |
| **Sitemap unique** | **98** |

No new indexable URLs added in this pass.

---

## 6. Theme classification (KEEP / IMPROVE / MERGE / …)

| Theme / URL class | Classification | Rationale |
|-------------------|----------------|-----------|
| Homepage `/` | IMPROVE | Fixed duplicate H2/H3; remains platform primary |
| Solutions (6) | KEEP | Intent primaries for outcome clusters |
| Features supporting solutions | IMPROVE | Titles differentiated from solutions |
| Use-cases (personas) | KEEP | Persona primary for overlapping ICPs |
| Industries (verticals) | REPOSITION | Sector/governance framing vs persona use-cases |
| Templates (5) | KEEP | Lead-magnet / framework intent |
| Resources hub | KEEP / IMPROVE | Pillar hub; reciprocal links strengthened |
| Docs | KEEP | Enablement; `/docs/*` preferred in marketing |
| Competitor / city / programmatic articles | DO_NOT_TARGET | Thin / inventable |
| Mass resource blog | DEFER | Editorial roadmap only |
| Healthcare/finance/legal industries | KEEP | Explicit non-cert claims retained |
| `/documentation` vs `/docs` | IMPROVE (docs-only debt) | Intentional dual entry; watch authority split |

---

## 7. Page ownership table

| Cluster | Primary URL | Supporting URLs | Owner type |
|---------|-------------|-----------------|------------|
| AI agency / MSP platform | `/` | `/features`, `/enterprise`, automation + MSP use-cases | Hub |
| Client health | `/solutions/customer-health-score` | health feature, CS feature, template, docs | Solution |
| Incidents | `/solutions/incident-management` | incidents feature, template, monitoring | Solution |
| Risk | `/solutions/risk-management` | risk feature, template | Solution |
| SLA | `/solutions/sla-management` | SLA template, monitoring | Solution |
| Executive reporting | `/solutions/ai-reporting` | AI reports + reports features, template | Solution |
| Executive dashboard | `/solutions/executive-dashboard` | portfolio KPI feature, solutions hub | Solution |
| Client portal | `/features/client-portal` | features, enterprise | Feature |
| Automation monitoring | `/features/monitoring` | automation, incidents | Feature |
| MSP persona | `/use-cases/msps` | IT use-case, IT industry, use-cases hub | Persona |
| Marketing agency persona | `/use-cases/marketing-agencies` | marketing industry, digital agencies | Persona |
| Pricing | `/pricing` | enterprise, pilot | Decision |
| Security trust | `/security` | compliance, vuln disclosure, docs | Trust |
| Resources hub | `/resources` | templates, documentation, `/docs` | Hub |

---

## 8. Search cluster ownership matrix

See `src/lib/seo/intent-ownership.ts` → `SEARCH_INTENT_CLUSTERS` (**14** clusters). One primary path per cluster; uniqueness guarded by `listPrimaryIntentPaths` + regression test.

---

## 9. Cannibalization conflicts fixed

| Conflict | Action |
|----------|--------|
| Homepage “service-led” / “operations leaders” H2+H3 | Suppress child H3 when parent owns title |
| `/industries/marketing` ↔ `/use-cases/marketing-agencies` | REPOSITION industry title + cross-links |
| `/industries/it` ↔ MSP/IT use-cases | REPOSITION industry + cross-links |
| `/industries/cybersecurity` ↔ cyber use-case | Cross-link + governance framing |
| `/industries/consulting` ↔ consultancies use-case | REPOSITION industry + cross-links |
| `/features/executive-dashboards` ↔ `/solutions/executive-dashboard` | Feature → Portfolio KPI dashboards; solution retains executive dashboard |

**Count fixed:** 6 material conflicts.

---

## 10. Internal linking

| Change | Detail |
|--------|--------|
| Nav | Added **Use cases** between Solutions and Industries |
| Footer | Moved Use cases into **product**; removed from company |
| Industry → use-case | Marketing, IT/MSP, cyber, consulting relatedLinks |
| Use-case → industry | Marketing, IT, MSP, consulting, cyber relatedLinks |
| Feature → solution | Executive dashboard solution link retained |

No spam footers; contextual relatedLinks only.

---

## 11. Homepage heading fix

**Confirmed source defect:** `MarketingSection` H2 + child component default H3 duplication for service-led / operations leaders.

**Fix:** `MarketingLogoCloud` / `MarketingTestimonials` render H3 only when `title` provided; homepage omits title props so parent H2 is sole heading.

---

## 12. Metadata / headings

Material title/meta updates only where cannibalization evidence was strong (industry repositioning; executive feature differentiation). No bulk keyword rewriting.

---

## 13. Structured data freeze

| Constraint | Status |
|------------|--------|
| SoftwareApplication-first | PASS |
| EUR offers from plan catalog | PASS |
| No Product merchant / shipping / return theatre on pricing | PASS |
| No AggregateRating / fake reviews | PASS |

---

## 14. Legacy billing integrity

| Provider | Active checkout/runtime |
|----------|-------------------------|
| FastSpring | 0 |
| Stripe | 0 |
| Paddle | 0 |
| Mollie | sole PSP |

---

## 15. Content integrity

| Check | Result |
|-------|--------|
| Invented claims | 0 |
| Thin programmatic pages | 0 |
| Fake testimonials/reviews | 0 |
| Unsupported certifications | 0 |
| Softened “Unlimited AI” industry advantage copy | Yes → entitled-plan wording |

---

## 16. Content roadmap (editorial — do not mass-publish)

| Priority | Topic | Intent | Persona | Cluster | Existing/New | Commercial | Evidence | Gain | Cannibalization | Action |
|----------|-------|--------|---------|---------|--------------|------------|----------|------|-----------------|--------|
| P1 | Client health methodology | Consideration | CS leads | client-health | Existing solution + template | Mid | Product health signals | High | vs health feature | IMPROVE spokes only |
| P1 | SLA policy for agencies | Consideration | Delivery mgrs | sla | Existing solution + template | Mid | SLA module | High | low | KEEP |
| P1 | Incident response playbook | Consideration | Ops leads | incidents | Existing template | Mid | Incidents module | High | vs feature | KEEP |
| P1 | MSP portfolio ops guide | Awareness | MSP owners | msp-persona | Existing use-case | High | MSP routes | High | vs IT industry | Persona owns |
| P1 | Marketing agency ops guide | Awareness | Agency ops | marketing-persona | Existing use-case | High | Use-case page | High | vs marketing industry | Persona owns |
| P2 | Executive KPI dashboard walkthrough | Consideration | COO | exec-dashboard | Existing solution | Mid | Dashboard module | Med | vs feature | Solution owns |
| P2 | AI reporting with human review | Consideration | Account leads | ai-reporting | Existing solution | Mid | Reports + AI | Med | vs AI feature | Solution owns |
| P2 | Client portal transparency | Consideration | Account mgrs | client-portal | Existing feature | Mid | Portal | Med | low | KEEP |
| P2 | Automation monitoring reliability | Consideration | Automation agencies | monitoring | Existing feature | Mid | Monitoring | Med | low | KEEP |
| P2 | Risk register for delivery | Consideration | Risk owners | risk | Existing solution | Mid | Risks module | Med | vs feature | Solution owns |
| P2 | Resources pillar deepen | Enablement | Operators | resources | Existing hub | Low | Pillars | Med | vs solutions | Hub owns |
| P3 | QBR prep workflow | Enablement | CS | health/reporting | New article | Low | Reports | Low | high if thin | DEFER |
| P3 | Connector deep-dives (per tool) | Consideration | Integrators | integrations | New | Low | Connectors exist | Low | thin risk | DEFER / DO_NOT_TARGET mass |
| P3 | City / competitor pages | Acquisition | Broad | n/a | New | Speculative | None | Neg | high | DO_NOT_TARGET |
| P3 | Certification claim pages | Trust | Procurement | security | New | High risk | Readiness only | Neg | trust damage | DO_NOT_TARGET |
| P3 | Multilingual mirrors | Awareness | DE/EN | all | New | Ops cost | No packs | Neg | duplicate | DEFER |
| P2 | Enterprise governance narrative | Decision | Enterprise | security/enterprise | Existing pages | High | Enterprise module | Med | low | IMPROVE copy later |
| P2 | Pilot program clarity | Decision | Design partners | pricing | Existing | High | Pilot invite-only | Med | vs pricing | KEEP |
| P2 | Template lead magnets usage | Consideration | Ops | templates | Existing | Mid | Templates | Med | vs solutions | KEEP framework wording |
| P3 | Predictive intelligence explainer | Consideration | Leaders | predictive docs | Docs only | Low | Deterministic forecasts | Low | overclaim risk | DEFER |
| P2 | Integrations hub vs feature | Consideration | Ops | integrations | Existing both | Mid | Connectors | Med | title clash residual | IMPROVE titles later |
| P3 | Case studies with named logos | Trust | Buyers | home | New | High | No public logos | Neg if faked | — | DO_NOT_TARGET until real |
| P2 | FAQ expansion (buyer) | Decision | Buyers | faq | Existing | Mid | FAQ module | Med | low | IMPROVE selectively |
| P3 | Industry healthcare/finance deep articles | Awareness | Vertical | industries | Existing pages | Low | Positioning only | Low | cert adjacency | DEFER |
| P1 | Internal link audit quarterly | Ops | SEO | all | Process | — | This pass | High | — | OPERATOR |
| P2 | GSC query mapping to clusters | Ops | SEO | all | Process | — | SEARCH_VOLUME_DATA_NOT_AVAILABLE | High | — | OPERATOR |
| P3 | Programmatic location pages | Awareness | Local | n/a | New | Speculative | None | Neg | thin | DO_NOT_TARGET |

**Roadmap size:** 26 topics. **Implemented foundational pages this pass:** 0 new. Architecture + ownership only.

---

## 17. New pages created

**0**

---

## 18. Existing pages materially improved

| Surface | Improvement |
|---------|-------------|
| Homepage components | Heading duplication removed |
| Marketing nav / footer | Use cases discoverability |
| Industry marketing/IT/cyber/consulting | Titles + relatedLinks |
| Audience overlapping personas | Industry reciprocal links |
| Feature executive-dashboards | Portfolio KPI title/meta |
| Intent ownership map | +persona/dashboard/resources clusters |
| Industry AI advantage copy | Entitled-plan wording |

**Count:** 8 material improvement groups.

---

## 19. Internal linking defects fixed

| Defect | Fix |
|--------|-----|
| Use cases footer-only under Company | Product footer + primary nav |
| Missing persona↔industry links | relatedLinks both directions |
| Executive feature/solution weak differentiation | Title + ownership split |

**Count:** 3 defect classes fixed.

---

## 20. Technical integrity snapshot

| Metric | Count |
|--------|------:|
| SEO blockers | 0 |
| Canonical conflicts | 0 |
| Sitemap conflicts | 0 |
| Indexability conflicts | 0 |
| Broken internal links introduced | 0 |
| Public sitemap URLs | 98 |

---

## 21. Implementation summary (code)

| File | Change |
|------|--------|
| `src/components/marketing/marketing-logo-cloud.tsx` | Optional title; no default competing H3 |
| `src/components/marketing/marketing-testimonials.tsx` | Optional title; no default competing H3 |
| `src/lib/marketing/content.ts` | Use cases in `MARKETING_NAV` |
| `src/lib/company/company-links.ts` | Use cases in product footer |
| `src/lib/seo/industry-content.ts` | Reposition titles; cross-links; AI copy |
| `src/lib/seo/audience-content.ts` | Industry reciprocal links |
| `src/lib/seo/feature-content.ts` | Portfolio KPI dashboard title |
| `src/lib/seo/intent-ownership.ts` | Expanded clusters |
| `scripts/technical-seo.test.mjs` | Phase 2 authority regression tests |

---

## 22. Testing plan executed

Discovered scripts from `package.json`. Ran: typecheck, lint, build, enterprise regression, legacy billing removal, technical SEO, production readiness/closeout (via mollie suite / final closeout as available).

---

## 23. Validation results

| Gate | Result |
|------|--------|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (pre-existing warnings only) |
| `npm run build` | PASS |
| `npm run test:enterprise-regression` | PASS **399/399** |
| `npm run test:legacy-billing-removal` | PASS **16/16** |
| `npm run test:technical-seo` | PASS **48/48** (includes new Phase 2 authority tests) |
| Authority regression (new) | PASS (5 Phase 2 authority cases in technical-seo) |
| `npm run test:mollie-billing` | PASS **323/323** |
| `npm run test:final-production-closeout` | PASS **30/30** |

---

## 24. Risks / residual debt (P3 — document only)

- `/documentation` vs `/docs` dual entry remains intentional; monitor SERP.
- Integrations triad (feature / marketing / docs) still soft-overlap — titles already partially differentiated historically.
- Industry pages for healthcare/finance/legal remain positioning pages — keep non-cert discipline.
- SEARCH_VOLUME_DATA_NOT_AVAILABLE — clusters are product-fit, not keyword volume.

---

## 25. Operator actions

1. After deploy: spot-check homepage headings (single H2 per section for logo/testimonials bands).
2. GSC: inspect titles for industry marketing/IT/consulting and executive feature/solution after index refresh.
3. Keep `MOLLIE_LIVE_CHARGING_ENABLED=false` until explicit LIVE approval.
4. Do **not** mass-publish roadmap articles without editorial evidence.

Push: **NO** (this pass).

---

## 26. Local commit

| Field | Value |
|-------|-------|
| Subject | `seo: phase 2 organic authority architecture and intent ownership` |
| Hash | _(filled after commit)_ |
| Ahead/behind | _(filled after commit)_ |
| Pushed | NO |

---

## 27. Freeze confirmations

- SoftwareApplication + EUR frozen  
- No Product/Merchant shipping/return regression  
- FastSpring/Stripe/Paddle active = 0  
- Mollie sole PSP  
- LIVE charging unchanged  

---

## 28. Sign-off

**Engineering verdict:** READY_FOR_OPERATOR_REVIEW  
**SEO architecture:** ownership map + cannibalization fixes shipped  
**Content factory:** deferred — roadmap only  
**Hard stop:** no push / no deploy / no LIVE charge  

---

## Appendix A — Counts for parent response

| Metric | Value |
|--------|------:|
| Search clusters mapped | 14 |
| Primary page owners | 14 |
| Cannibalization conflicts fixed | 6 |
| New pages created | 0 |
| Existing pages materially improved | 8 |
| Internal linking defects fixed | 3 |
