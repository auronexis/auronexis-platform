# Operator Compliance Execution Record — 2026-09-02

**Status:** `OPERATOR_COMPLIANCE_ACTION_REQUIRED`  
**Pack posture:** `COUNSEL_REVIEW_PACK_READY` (engineering handoff only — not legal approval)  
**Executor:** Automated operator verification agent (read-only / non-destructive)  
**Baseline HEAD (start):** `7a76d635883b7ada5fc210c5337d7336a959d047`  
**origin/main:** `1fe7a59085060fa67d679bc70f702ef0106a8de7`  
**Branch:** `main` (ahead of origin/main by counsel pack commit only at start)  
**Production deploy reference (from pack):** `dpl_6PR2b15pANakArv3vHXZjCkd8gpX`  
**Absolute freeze:** Observed — no Mollie/billing/IndexNow/DEP0169/env/DB/RLS/RBAC/auth/AI/analytics/runtime/public legal text changes; no push; no deploy.

**Hard rules applied**

- Documentation ≠ PASS.
- No secrets, customer PII, credentials, or tokens recorded here.
- No real breach notification, DSAR deletion, payment, marketing send, or production mutation.
- Forbidden labels not asserted: `GDPR_CERTIFIED`, `AI_ACT_CERTIFIED`, `FULLY_COMPLIANT`, `LEGAL_APPROVED`, `COUNSEL_APPROVED`, `AI_ACT_COMPLIANT`.

---

## Phase 1 — Checklist inventory matrix

| CONTROL | REQUIRED ACTION | AVAILABLE EVIDENCE | EXECUTABLE NOW? | RESULT | OPERATOR ACTION | COUNSEL DEPENDENCY |
|---------|-----------------|--------------------|-----------------|--------|-----------------|--------------------|
| M1 GDPR/security open items | Review Compliance center statuses | Playbooks + `gdpr_requests` / incidents modules exist; live dashboard not accessed | NO (needs live session) | DOCUMENTED_ONLY | Spot-check live Compliance center | No |
| M2 Sentry PII skim | Review error volume if enabled | Sentry OPTIONAL; scrubbing claimed in inventory notes | PARTIAL | UNKNOWN_ENABLEMENT | Attest Sentry Y/N then skim if on | Cookie/LI vs consent (Q12) |
| M3 Marketing consent default | Spot-check live forms unchecked-by-default | P1 remediation claims; forms not live-checked this run | NO | DOCUMENTED_ONLY | Live newsletter/contact spot check | Marketing consent (Q18) |
| M4 Deploy / domain health | Verify prod deploy + domain | Pack cites deploy id; local inspect artifact exists | PARTIAL | PARTIAL | Confirm current prod health in Vercel | No |
| M5 Privacy mailboxes | Check legal@ / privacy@ / security@ / support@ | Addresses in `company-contact.ts` only | NO | OPERATOR_CONFIRMATION_REQUIRED | Prove mailbox delivery/monitoring | No |
| Q1 Subprocessors sync | Diff `/subprocessors` vs inventory version | `subprocessors-2026-09-02-v2` in `subprocessors-inventory.ts`; counsel review aligns | YES (code/doc) | PASS_ENGINEERING | After any provider change, re-diff | Characterisation / notice (Q9,Q16,Q17) |
| Q2 DPA version vs acceptances | Compare `DPA_DOCUMENT_VERSION` vs acceptances | `dpa-2026-08-29-v1`; `READY_FOR_EXTERNAL_LEGAL_REVIEW` | PARTIAL | DOCUMENTED_ONLY | Sample acceptance records if any | DPA adequacy (Q1–2) |
| Q3 Breach tabletop | Run fictional drill | Worksheet + runbook; **executed paper drill this run** | YES (non-destructive) | BREACH_TABLETOP_PASS | Retain internal ticket copy; do not notify from drill | Thresholds (Q10) |
| Q4 DSAR tabletop | ACCESS + ERASURE dry-run | Worksheet + playbooks; **executed paper drill this run** | YES (non-destructive) | DSAR_TABLETOP_PASS | Keep manual fulfillment path; no wipe | Statutory retention (Q15) |
| Q5 OPTIONAL provider attestation | Y/N for Sentry/GA4/PostHog/Plausible/Clarity/OpenAI/Resend | Inventory classes only; env values not attested this run | NO | OPTIONAL_NOT_CONFIRMED | Complete internal attestation sheet | Transfers if newly enabled |
| Q6 Public claim drift | Review vs `legal-claims-register.md` | Register + targeted marketing/legal grep | YES (doc) | P2_DOC_DRIFT | Do not rewrite public copy in this freeze | Claims #3,#8,#10,#12,#15 |
| Q7 Retention simulation | Confirm no auto-delete; invoices/E-Invoice carve-out | `retention-cleanup.ts` `autoDeleteEnabled: false`; `docs/retention.md`; retention-operator-review | YES (code/doc) | RETENTION_READY | Do **not** enable auto-deletion | Simulation vs DPA §16 (Q14–15) |
| A1 External counsel refresh | Counsel memo | Pack ready; no written counsel approval in repo | NO | COUNSEL_PENDING | Send pack; store privileged memo outside git | Entire pack |
| A2 RoPA update | Update if processing changed | `ropa-counsel-review.md` groundwork | NO | GROUNDWORK_ONLY | Update when processors change | Formal Art. 30 (Q6) |
| A3 DPIA triggers | Revisit screening | `dpia-counsel-review.md` MIXED / AI recommended | NO | COUNSEL_PENDING | Revisit on AI/analytics enablement | Art. 35 (Q5) |
| A4 Admin access review | Who has Vercel/Supabase/Mollie admin | Ops password manager (not in git) | NO | OPERATOR_CONFIRMATION_REQUIRED | Annual access attestation | No |
| A5 Dependency posture | High-level vuln review | CI process (not re-run as release gate here) | NO | DOCUMENTED_ONLY | Schedule proportionate review | No |
| A6 Imprint accuracy | Address/VAT/contacts | `company-information.ts` / imprint sources exist | PARTIAL | DOCUMENTED_ONLY | Confirm live imprint matches registry | No |

---

## Phase 2 — Provider inventory

Canonical source: `src/lib/company/subprocessors-inventory.ts` (`subprocessors-2026-09-02-v2`).  
Billing sole active provider code: `getActiveBillingProvider()` → `"mollie"` (`src/lib/billing/provider.ts`).

| Provider | Inventory class | Operator execution class | Notes |
|----------|-----------------|--------------------------|-------|
| Vercel | ACTIVE | **ACTIVE** | Hosting always-on path |
| Supabase | ACTIVE | **ACTIVE** | DB/Auth/storage always-on path |
| Mollie | ACTIVE (`PSP_INDEPENDENT`) | **ACTIVE** | PSP only; **not** MoR |
| SMTP / STRATO | ACTIVE | **ACTIVE** | Primary transactional email per inventory |
| Resend | OPTIONAL_CONFIGURABLE | **OPTIONAL_NOT_CONFIRMED** | Enablement not attested this run |
| OpenAI | OPTIONAL_CONFIGURABLE | **OPTIONAL_NOT_CONFIRMED** | Optional AI; do not treat as always-on |
| Sentry | OPTIONAL_CONFIGURABLE | **OPTIONAL_NOT_CONFIRMED** | Optional monitoring |
| GA4 | OPTIONAL_CONFIGURABLE | **OPTIONAL_NOT_CONFIRMED** | Consent-gated if configured (`ANALYTICS_CONFIG`) |
| PostHog | OPTIONAL_CONFIGURABLE | **OPTIONAL_NOT_CONFIRMED** | Consent-gated; EU host preferred in code defaults |
| Plausible | OPTIONAL_CONFIGURABLE | **OPTIONAL_NOT_CONFIRMED** | Consent-gated if configured |
| Microsoft Clarity | OPTIONAL_CONFIGURABLE | **OPTIONAL_NOT_CONFIRMED** | Consent-gated if configured |
| Postmark | CODE_SUPPORTED_NOT_ACTIVE | **CODE_SUPPORTED_NOT_ACTIVE** | Not treated ACTIVE |
| Mailgun | CODE_SUPPORTED_NOT_ACTIVE | **CODE_SUPPORTED_NOT_ACTIVE** | Not treated ACTIVE |
| Amazon SES | CODE_SUPPORTED_NOT_ACTIVE | **CODE_SUPPORTED_NOT_ACTIVE** | Not treated ACTIVE |
| Anthropic | CODE_SUPPORTED_NOT_ACTIVE | **CODE_SUPPORTED_NOT_ACTIVE** | Not treated ACTIVE |
| Azure OpenAI | CODE_SUPPORTED_NOT_ACTIVE | **CODE_SUPPORTED_NOT_ACTIVE** | Not treated ACTIVE |

**Wrong-activation flag:** No evidence in canonical inventory that CODE_SUPPORTED providers are labeled ACTIVE. **Do not** promote Postmark/Mailgun/SES/Anthropic/Azure OpenAI to ACTIVE without env attestation + inventory version bump.  
**Stale risk:** Internal docs still calling FastSpring active MoR must not be read as runtime truth (see Phase 12).

CSP allowlists in a local Vercel inspect artifact include PostHog EU / Plausible / Clarity / GA / Sentry hosts — that proves **script allowance**, not live enablement.

---

## Phase 3 — Region attestation

| Platform | Result | Evidence (non-invented) |
|----------|--------|-------------------------|
| Vercel | **PARTIAL** | Inventory: “As configured for the production deployment.” Local `.tmp-vercel-inspect.txt` repeatedly lists serverless region token `iad1` for the inspected production build — **operator must confirm** in Vercel project settings that this remains the current production primary. No EU DC invented. |
| Supabase | **OPERATOR_CONFIRMATION_REQUIRED** | Inventory: “EU-capable regions (as configured for the production project).” No project region / DC name proven in this read-only pass. Do not invent. |

---

## Phase 4 — Subprocessor review

| Check | Result |
|-------|--------|
| Inventory ↔ counsel review ACTIVE/OPTIONAL/CODE_SUPPORTED split | ALIGNED |
| Public page / DPA Annex III same inventory source | ALIGNED (engineering) |
| Mollie listed PSP not MoR | ALIGNED (engineering intent); counsel characterisation open |
| Public text edits | **NONE** (freeze) |
| Counsel status | `COUNSEL_REVIEW_REQUIRED` |

---

## Phase 5 — Breach tabletop (NON-DESTRUCTIVE)

**Scenario used:** Fictional accidental exposure of a **customer workspace integration token** in application/error logs (per `operator-breach-tabletop.md`). Mollie credentials assumed **not** in sample; single tenant; no ransomware.

| Phase | Tabletop decision (fictional) |
|-------|-------------------------------|
| Detection T0 | Record UTC awareness; systems = app logs / optional Sentry / Vercel logs; classify as security incident **and** potential personal data breach (PD suspected via org/user identifiers adjacent to token) |
| Containment | **Simulate only:** revoke/rotate the exposed customer token via product/integration controls; stop further token logging; restrict log access need-to-know; preserve evidence |
| Role | **Processor path** for customer workspace integration credential → notify controller customer without undue delay; do **not** decide their Art. 33 filing |
| Impact | Confidentiality impact high for that integration; subjects approximate = one customer org staff / end-systems; log host may be sub-processor |
| 72h clock | Start assessment at awareness; authority notification for Auroranexis-as-processor usually **not** substituted for customer’s assessment; separate controller assessment only if Auroranexis-controller data also exposed |
| DS notification | Assess high risk; typically customer-led for end subjects; document if Auroranexis notifies its own users |
| Closure | Root cause = debug logging; follow-up = logging redaction control; consider RoPA/DPIA touch if systemic |

**Drill fields filled for record**

- Awareness timestamp: `2026-09-02T00:00:00Z` (fictional drill marker — not a real incident)
- Authority notification required? **N for this processor-path drill** pending counsel Q10 — document rationale; customer (controller) notification **Y (simulated)**
- Customer notified? **SIMULATED** — no real message sent

**Result:** `BREACH_TABLETOP_PASS`  
**Not done:** real `security_incidents` row, real customer email, authority contact, secret rotation.

---

## Phase 6 — DSAR ACCESS + ERASURE tabletop (NON-DESTRUCTIVE)

**Fictional subject:** Alex Example / Example GmbH (worksheet).

### ACCESS (Art. 15) — paper pass

| Step | Outcome |
|------|---------|
| A1 Identity | Plan: verify account ownership before disclosure |
| A2 Store map | Auth/profile, memberships, ops, portal, AI logs if any, marketing if any, audit subset — per `dsar-operator-playbooks.md` |
| A3 Export plan | Redacted package; no secrets; no cross-tenant |
| A4 Response outline | Purposes, categories, recipients/subprocessors summary, retention intent, rights |
| A5 Closure | Simulated delivery evidence + status update plan |

### ERASURE (Art. 17) — paper pass / no delete

| Class | Handling |
|-------|----------|
| Ops data | Operator-assisted delete/anonymize plan; archive-first for clients |
| Marketing/consent | Suppress/delete plan + consent withdrawal evidence |
| AI logs | Delete/anonymize if no hold |
| Sales invoices / E-Invoice | **EXCLUDED** — statutory |
| Security logs | Minimize/restrict, not wholesale wipe |

**Result:** `DSAR_TABLETOP_PASS`  
**Manual steps remaining:** live identity verification; Compliance center logging; actual export assembly; operator-assisted erasure execution when a real request arrives; dual-control for high-impact tenants.

---

## Phase 7 — Retention review

| Check | Evidence | Result |
|-------|----------|--------|
| Auto-delete enabled? | `processRetentionCleanupJob` returns `autoDeleteEnabled: false`; defaults `simulation_only: true` | **NO** |
| Invoices / E-Invoice blind purge? | `docs/retention.md` + retention-operator-review: `STATUTORY` / never via retention job; client hard-delete does not cascade billing/invoice/Mollie rows | **NOT blindly purged** |
| Operator rule | Do not enable destructive auto-delete | Confirmed instruction |

**Result:** `RETENTION_READY` (engineering behaviour). Live dashboard spot-check remains a monthly operator habit item.

---

## Phase 8 — Privacy contacts

| Address | Code source | Mailbox proven? |
|---------|-------------|-----------------|
| legal@auroranexis.com | `COMPANY_CONTACT.legalEmail` | **OPERATOR_CONFIRMATION_REQUIRED** |
| privacy@auroranexis.com | `COMPANY_CONTACT.privacyEmail` | **OPERATOR_CONFIRMATION_REQUIRED** |
| security@auroranexis.com | `COMPANY_CONTACT.securityEmail` | **OPERATOR_CONFIRMATION_REQUIRED** |
| support@auroranexis.com | `COMPANY_CONTACT.supportEmail` | **OPERATOR_CONFIRMATION_REQUIRED** |

---

## Phase 9 — AI operator readiness

| Item | Status |
|------|--------|
| Public `/docs/ai-literacy` | Engineering complete; production HTTP 200 noted in pack baseline |
| `AiDisclosure` on generative surfaces | Engineering evidence in AI Act counsel review |
| Labels `AI_ACT_COMPLIANT` / `CERTIFIED` / `LEGAL_APPROVED` | **Not asserted** |
| Art. 50 / Art. 4 legal sufficiency | `COUNSEL_REVIEW_REQUIRED` |
| OpenAI production enablement | `OPTIONAL_NOT_CONFIRMED` |

---

## Phase 10 — Cookie / analytics

| Provider | Class | Consent posture (code) | Live status this run |
|----------|-------|------------------------|----------------------|
| GA4 | OPTIONAL | Marketing consent; fail-closed | UNKNOWN / OPTIONAL_NOT_CONFIRMED |
| PostHog | OPTIONAL | Analytics consent | UNKNOWN / OPTIONAL_NOT_CONFIRMED |
| Plausible | OPTIONAL | Analytics consent | UNKNOWN / OPTIONAL_NOT_CONFIRMED |
| Clarity | OPTIONAL | Analytics consent | UNKNOWN / OPTIONAL_NOT_CONFIRMED |
| Sentry | OPTIONAL | Separate optional monitoring (counsel Q12) | UNKNOWN / OPTIONAL_NOT_CONFIRMED |

**Disable procedure documented?** **PARTIAL** — `docs/analytics-consent-checklist.md` + `ANALYTICS_CONFIG` fail-silent when env unset / non-production; unset relevant `NEXT_PUBLIC_*` and redeploy is the engineering disable path. No separate sole-prop runbook beyond checklist + inventory change procedure for public list updates.

---

## Phase 11 — Public claim drift

| Finding | Rating |
|---------|--------|
| Public marketing/legal grep: no FastSpring MoR in `legal-content.ts`; marketing frames “not certified” | No P1 public FastSpring claim found this pass |
| DPA SCC “where required” without TIA pack in repo | Counsel priority (register #8) — not rewritten |
| Internal FastSpring-as-active-MoR rows | Stale internal documentation |

**Public claim risk:** `P2_DOC_DRIFT` (internal/doc drift; no proven `P1_PUBLIC_CLAIM_RISK` this pass).  
**No public copy rewritten.**

---

## Phase 12 — Stale FastSpring / MoR docs

| Location | Classification |
|----------|----------------|
| `docs/compliance/README.md` “Billing via FastSpring Merchant of Record (active)” | **INTERNAL_DOC_DRIFT** |
| `docs/compliance/compliance-evidence-index.md` EVD-BILL-001 FastSpring MoR | **INTERNAL_DOC_DRIFT** / treat as **HISTORICAL_ONLY** until refreshed |
| `docs/compliance/data-act-portability-baseline.md` MoR FastSpring | **HISTORICAL_ONLY** / drift |
| Runtime + public inventory Mollie PSP | Authoritative engineering reality |

**Mollie = PSP, not MoR.**  
**PUBLIC_RISK from FastSpring wording:** not evidenced on public legal surfaces in this pass; keep inventory/public billing disclosures Mollie-accurate.

---

## Phase 13 — Closable split

### OPERATOR-CLOSABLE

1. Attest OPTIONAL providers Y/N (Sentry, GA4, PostHog, Plausible, Clarity, OpenAI, Resend).  
2. Confirm Vercel primary region and Supabase project region in vendor consoles.  
3. Prove legal@ / privacy@ / security@ / support@ mailbox monitoring.  
4. Live Compliance center / marketing-form / imprint spot checks (M1/M3/A6).  
5. Store formal tabletop tickets (breach/DSAR) outside git without secrets.  
6. Annual admin access review (Vercel/Supabase/Mollie).  
7. Schedule internal doc hygiene for FastSpring MoR drift (docs-only change control — not this freeze’s runtime scope).  
8. Keep retention auto-delete **disabled**.

### COUNSEL-ONLY

1. DPA / Art. 28 AVV adequacy (`dpa-2026-08-29-v1`).  
2. SCC / TIA / Chapter V tools for ACTIVE (+ OPTIONAL when enabled).  
3. DPIA Art. 35 decision (esp. generative AI).  
4. Formal Art. 30 RoPA conversion.  
5. Art. 50 disclosure sufficiency + Art. 4 literacy scope.  
6. Mollie PSP vs Art. 28 subprocessor characterisation.  
7. Breach notification thresholds (controller vs processor).  
8. Cookie / Sentry / analytics under TTDSG–TDDDG.  
9. Retention honesty vs deletion obligations / DE statutory periods.  
10. B2B § 14 BGB framing adequacy; marketing consent separation.

---

## Open priorities (this execution)

| Class | Items |
|-------|-------|
| OPEN P0 | **None proven** this run |
| ENGINEERING P1 | **None new** — pack notes prior GDPR+AI P1 FIXED/MITIGATED; no runtime changes authorized here |
| OPERATOR P1 | Mailbox proof; region attestation; OPTIONAL enablement attestation; live M1/M3 spot checks; retain tabletop evidence internally |

---

## Validation

- Files changed intentionally: **this execution record only**.  
- Build skipped (Markdown-only).  
- Absolute freeze: **YES**.  
- Pushed: **NO**. Deployed: **NO**.
