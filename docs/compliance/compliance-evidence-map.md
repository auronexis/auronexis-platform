# Compliance Evidence Map

**Status:** `PARTIAL` (map complete; many counsel cells open)  
**Baseline SHA:** `1fe7a59085060fa67d679bc70f702ef0106a8de7`  
**Rule:** Trace LEGAL REQUIREMENT → DOCUMENT → CODE → RUNTIME → OPERATOR PROCESS → COUNSEL STATUS.

Allowed counsel/engineering statuses: `ENGINEERING_COMPLETE`, `OPERATOR_REVIEW_REQUIRED`, `COUNSEL_REVIEW_REQUIRED`, `READY_FOR_EXTERNAL_LEGAL_REVIEW`, `PARTIAL`, `NOT_APPLICABLE_WITH_EVIDENCE`, `UNKNOWN`.

---

## Map

| Legal requirement (theme) | Document | Code | Runtime | Operator process | Counsel status |
|---------------------------|----------|------|---------|------------------|----------------|
| Art. 28 DPA / AVV | `dpa-counsel-review.md`; public `/data-processing-agreement` | `dpa-document.ts` | Published page on www | Customer acceptance / enterprise countersign via legal@ | `READY_FOR_EXTERNAL_LEGAL_REVIEW` |
| Art. 28 subprocessors | `subprocessor-counsel-review.md`; `/subprocessors` | `subprocessors-inventory.ts` | Inventory version `subprocessors-2026-09-02-v2` | `docs/billing/subprocessor-change-procedure.md` | `COUNSEL_REVIEW_REQUIRED` |
| Chapter V transfers | `international-transfer-review.md`; DPA Annex IV | Location wording in inventory; **no TIA files** | Env-dependent OPTIONAL providers | Operator region/enablement attestation | `PARTIAL` / `COUNSEL_REVIEW_REQUIRED` |
| Art. 30 RoPA | `ropa-counsel-review.md`; `ropa-processing-inventory.md` | N/A (doc groundwork) | N/A | Annual update checklist | `ROPA_GROUNDWORK_READY_FOR_REVIEW` → counsel convert |
| Art. 35 DPIA | `dpia-counsel-review.md`; `dpia-screening.md` | AI feature modules (scope evidence) | Optional AI enablement | Revisit on change | `COUNSEL_REVIEW_REQUIRED` |
| Arts. 33–34 breach | `personal-data-breach-runbook.md`; `operator-breach-tabletop.md` | `security_incidents` / compliance incidents modules | Monitoring / logs | Tabletop **not executed** | `OPERATOR_REVIEW_REQUIRED` |
| Arts. 15–21 DSAR | `dsar-operator-playbooks.md`; `operator-dsar-tabletop.md` | `gdpr_requests`, export helpers | Compliance center tracking | Manual fulfillment; tabletop **not executed** | `OPERATOR_REVIEW_REQUIRED` |
| Retention / storage limitation | `retention-operator-review.md`; `docs/retention.md` | `retention.ts` simulation | No auto-delete | Offboarding / DSAR / statutory carve-outs | `PARTIAL` / `COUNSEL_REVIEW_REQUIRED` |
| Art. 32 TOMs / security | Security Policy; DPA Annex II; security docs | `src/lib/security/**`, RBAC, RLS | TLS, authn/z, headers | CVD + incident ops | `COUNSEL_REVIEW_REQUIRED` (adequacy) |
| Cookie / ePrivacy | `/cookies`, Privacy; consent components | Consent banner/modal; analytics fail-closed | Optional tags if env set | Monthly spot check | `COUNSEL_REVIEW_REQUIRED` |
| Marketing consent | Privacy; P1 remediation report | Newsletter/contact flows (unchecked default) | Live forms | Monthly spot check | `COUNSEL_REVIEW_REQUIRED` |
| AI Act Art. 50 transparency | `ai-act-counsel-review.md` | `AiDisclosure` wirings | Labels on generative UI | Report missing labels | `COUNSEL_REVIEW_REQUIRED` |
| AI Act Art. 4 literacy | `ai-literacy-counsel-review.md` | `AI_LITERACY_DOC` | `/docs/ai-literacy` HTTP 200 (operator baseline) | Staff measures TBD by counsel | `COUNSEL_REVIEW_REQUIRED` |
| AI Act risk class | `ai-act-gap-baseline.md` | `src/lib/ai/**` | Optional OpenAI | Prohibited-use screening gap | `COUNSEL_REVIEW_REQUIRED` |
| Public claim accuracy | `legal-claims-register.md` | `legal-content.ts`, FAQ/marketing | Published pages | Quarterly claim drift review | `COUNSEL_REVIEW_REQUIRED` |
| B2B contracting frame | Privacy/Terms | `legal-content.ts` | Published | Checkout/legal narrative | `COUNSEL_REVIEW_REQUIRED` |
| Accountability / audit | `docs/compliance.md` | `audit_events`, compliance platform | Dashboard compliance/audit | Evidence exports | `ENGINEERING_COMPLETE` (capability) / not certification |
| Vulnerability disclosure | CVD runbook; security.txt | `security.txt` route; CVD pages | Public policy | Intake via security@ | `ENGINEERING_COMPLETE` / CRA counsel separate |
| Billing PD / invoices | Billing docs; e-invoice archive docs | Mollie modules; invoice archive | PSP + statutory store | Refund/correction runbooks | `COUNSEL_REVIEW_REQUIRED` (tax/legal separate packs) |

---

## Cross-cutting gaps

| Gap | Status |
|-----|--------|
| Executed breach/DSAR tabletops | `OPERATOR_REVIEW_REQUIRED` |
| Per-provider SCC/TIA pack | `UNKNOWN` / absent — do not fabricate |
| Formal Art. 30 record | Groundwork only |
| Final DPIA decision | Counsel only |
| Stale FastSpring mentions in older compliance docs | Documentation drift — Mollie is ACTIVE PSP |

---

## Freeze reminder

This map is documentation. It does **not** authorize runtime, billing, auth, RLS, analytics, or AI prompt changes.
