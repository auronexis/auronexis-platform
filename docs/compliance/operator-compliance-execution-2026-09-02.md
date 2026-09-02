# Operator Compliance Execution Record — 2026-09-02

**Status:** `OPERATOR_P1_MANUAL_CONFIRMATION_REQUIRED`  
**Pack posture:** `COUNSEL_REVIEW_PACK_READY` (engineering handoff only — not legal approval)  
**Executor:** Automated operator verification agent (read-only / non-destructive) + FINAL OPERATOR CLOSURE PASS  
**Baseline HEAD (start this closure):** `ee6bce2bf606eec3f0b664ec47c2185c31411a85`  
**origin/main:** `1fe7a59085060fa67d679bc70f702ef0106a8de7`  
**Branch:** `main` (docs-only stack ahead of origin/main)  
**Production deploy reference:** `dpl_6PR2b15pANakArv3vHXZjCkd8gpX` (observed in live HTML chunk URLs)  
**Absolute freeze:** Observed — no Mollie/billing/IndexNow/DEP0169/env mutation/DB/RLS/RBAC/auth/AI/analytics/runtime/public legal text changes; no push; no deploy. **P1-002 LIVE BILLING out of scope.**

**Hard rules applied**

- Documentation ≠ PASS.
- No secrets, customer PII, credentials, or tokens recorded here (env **names** only).
- No real breach notification, DSAR deletion, payment, marketing send, or production mutation.
- Forbidden labels not asserted: `GDPR_CERTIFIED`, `AI_ACT_CERTIFIED`, `FULLY_COMPLIANT`, `LEGAL_APPROVED`, `COUNSEL_APPROVED`, `AI_ACT_COMPLIANT`.

---

## Phase 1 — Checklist inventory matrix

| CONTROL | REQUIRED ACTION | AVAILABLE EVIDENCE | EXECUTABLE NOW? | RESULT | OPERATOR ACTION | COUNSEL DEPENDENCY |
|---------|-----------------|--------------------|-----------------|--------|-----------------|--------------------|
| M1 GDPR/security open items | Review Compliance center statuses | Live `/dashboard/compliance` redirects to login | NO (auth session) | `OPERATOR_BROWSER_CHECK_REQUIRED` | Spot-check live Compliance center after login | No |
| M2 Sentry PII skim | Review error volume if enabled | `SENTRY_DSN` present in Production env names | PARTIAL | `CONFIGURED_STATUS_UNKNOWN` | Attest Sentry traffic then skim if on | Cookie/LI vs consent (Q12) |
| M3 Marketing consent default | Spot-check live forms unchecked-by-default | Live `/contact` + `/pricing` HTML | YES | `MARKETING_CONSENT_LIVE_PASS` | Re-spot-check after form deploys | Marketing consent (Q18) |
| M4 Deploy / domain health | Verify prod deploy + domain | `/api/health` healthy; deploy id in HTML | YES | PASS_OPERATOR | Confirm current prod health in Vercel periodically | No |
| M5 Privacy mailboxes | Check legal@ / privacy@ / security@ / support@ | Addresses in code only | NO | `MAILBOX_OPERATOR_CONFIRMATION_REQUIRED` | Prove mailbox delivery/monitoring | No |
| Q1 Subprocessors sync | Diff `/subprocessors` vs inventory version | `subprocessors-2026-09-02-v2` | YES (code/doc) | PASS_ENGINEERING | After any provider change, re-diff | Characterisation / notice (Q9,Q16,Q17) |
| Q2 DPA version vs acceptances | Compare `DPA_DOCUMENT_VERSION` vs acceptances | `dpa-2026-08-29-v1` | PARTIAL | DOCUMENTED_ONLY | Sample acceptance records if any | DPA adequacy (Q1–2) |
| Q3 Breach tabletop | Run fictional drill | Executed earlier this calendar day (paper) | DO NOT RERUN | `BREACH_TABLETOP_PASS` | External ticket copy | Thresholds (Q10) |
| Q4 DSAR tabletop | ACCESS + ERASURE dry-run | Executed earlier this calendar day (paper) | DO NOT RERUN | `DSAR_TABLETOP_PASS` | External ticket copy | Statutory retention (Q15) |
| Q5 OPTIONAL provider attestation | Y/N for Sentry/GA4/PostHog/Plausible/Clarity/OpenAI/Resend | Vercel env **names** + live HTML + `/api/health` | PARTIAL | See Phase 2 closure | Confirm consent-gated runtime / AI usage intent | Transfers if newly enabled |
| Q6 Public claim drift | Review vs `legal-claims-register.md` | Internal FastSpring MoR drift repaired this pass | YES (doc) | INTERNAL_DRIFT_REPAIRED | Do not rewrite public copy in this freeze | Claims #3,#8,#10,#12,#15 |
| Q7 Retention simulation | Confirm no auto-delete; invoices/E-Invoice carve-out | Code + `docs/retention.md` | YES | `RETENTION_SAFETY_CONFIRMED` | Do **not** enable auto-deletion | Simulation vs DPA §16 (Q14–15) |
| A1 External counsel refresh | Counsel memo | Pack ready; no written counsel approval in repo | NO | COUNSEL_PENDING | Send pack; store privileged memo outside git | Entire pack |
| A2 RoPA update | Update if processing changed | `ropa-counsel-review.md` groundwork | NO | GROUNDWORK_ONLY | Update when processors change | Formal Art. 30 (Q6) |
| A3 DPIA triggers | Revisit screening | `dpia-counsel-review.md` MIXED / AI recommended | NO | COUNSEL_PENDING | Revisit on AI/analytics enablement | Art. 35 (Q5) |
| A4 Admin access review | Who has Vercel/Supabase/Mollie admin | Procedure doc created | PARTIAL | `ADMIN_ACCESS_PROCEDURE_READY` + `OPERATOR_ACCOUNT_REVIEW_REQUIRED` | Complete annual attestation outside git | No |
| A5 Dependency posture | High-level vuln review | CI process | NO | DOCUMENTED_ONLY | Schedule proportionate review | No |
| A6 Imprint accuracy | Address/VAT/contacts | Live `/imprint` HTML markers | YES | `IMPRINT_LIVE_PASS` | Confirm vs registry when entity data changes | No |

---

## Phase 2 — Provider inventory (FINAL CLOSURE)

Canonical source: `src/lib/company/subprocessors-inventory.ts` (`subprocessors-2026-09-02-v2`).  
Billing sole active provider code: `getActiveBillingProvider()` → `"mollie"`.  
Evidence sources this pass: `vercel env ls production` (**names only**), anonymous Production HTML, `GET /api/health`, CSP in `.tmp-vercel-inspect.txt`.

| Provider | Inventory class | Env name in Production? | Observed anonymous HTML? | Consent-gated? | Closure class |
|----------|-----------------|-------------------------|--------------------------|----------------|---------------|
| Vercel | ACTIVE | n/a (host) | n/a | n/a | **ACTIVE** |
| Supabase | ACTIVE | `NEXT_PUBLIC_SUPABASE_*` present | n/a | n/a | **ACTIVE** |
| Mollie | ACTIVE (`PSP_INDEPENDENT`) | `MOLLIE_API_KEY` present; health `mollie:true` | n/a | n/a | **ACTIVE** (PSP; not MoR) |
| SMTP / STRATO | ACTIVE | `SMTP_*` + `EMAIL_PROVIDER` present | n/a | n/a | **ACTIVE** |
| Resend | OPTIONAL_CONFIGURABLE | `RESEND_API_KEY` **absent** | no | n/a | **INACTIVE_CONFIRMED** |
| OpenAI | OPTIONAL_CONFIGURABLE | `OPENAI_API_KEY`, `AI_ENABLED`, `AI_PROVIDER` present; health `ai:true` | no paid call made | n/a | **ACTIVE_CONFIRMED** (configured enablement via health; **no** paid generation invoked) |
| Sentry | OPTIONAL_CONFIGURABLE | `SENTRY_DSN` present; `NEXT_PUBLIC_SENTRY_DSN` absent | no sentry host in anonymous HTML | separate optional monitoring | **CONFIGURED_STATUS_UNKNOWN** (configured; runtime traffic not attested) |
| GA4 | OPTIONAL_CONFIGURABLE | `NEXT_PUBLIC_GA_MEASUREMENT_ID` present; `GA4_API_SECRET` absent from list | no gtag/GTM script observed anonymous | marketing consent | **CONFIGURED_STATUS_UNKNOWN** (configured + consent-gated; not observed without consent) |
| PostHog | OPTIONAL_CONFIGURABLE | `NEXT_PUBLIC_POSTHOG_KEY` present | no posthog script observed anonymous | analytics consent | **CONFIGURED_STATUS_UNKNOWN** |
| Plausible | OPTIONAL_CONFIGURABLE | `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` **absent** | no | analytics consent | **INACTIVE_CONFIRMED** |
| Microsoft Clarity | OPTIONAL_CONFIGURABLE | `NEXT_PUBLIC_CLARITY_PROJECT_ID` present | no clarity script observed anonymous | marketing/analytics consent | **CONFIGURED_STATUS_UNKNOWN** |
| Postmark / Mailgun / SES / Anthropic / Azure OpenAI | CODE_SUPPORTED_NOT_ACTIVE | not treated ACTIVE | — | — | **CODE_SUPPORTED_NOT_ACTIVE** |

**Wrong-activation flag:** CODE_SUPPORTED providers still not labeled ACTIVE.  
**Note:** CSP allowlists ≠ live enablement. Env presence ≠ consent grant ≠ observed script load.

---

## Phase 3 — Region attestation (FINAL)

| Platform | Result | Evidence (non-invented) |
|----------|--------|-------------------------|
| Vercel | **CONFIRMED** (primary serverless region token `iad1` = US East / **not EU**) | Local `.tmp-vercel-inspect.txt` for production deploy repeatedly lists `iad1`. Meaning: Washington Dulles region family — **not** an EU DC. Operator may still reconfirm in Vercel Project Settings → Functions region if they change primary. |
| Supabase | **CONFIRMED** | `supabase projects list`: project `auroranexis-prod`, ref `norrzshzshmvbrmpmhjb`, **`region":"eu-central-1"`**, status `ACTIVE_HEALTHY`. |

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

## Phase 5 — Breach tabletop (NON-DESTRUCTIVE) — DO NOT RERUN

Prior paper drill retained (`BREACH_TABLETOP_PASS`). External record:

| Field | Value |
|-------|-------|
| Date | 2026-09-02 |
| Scenario | Fictional customer workspace integration token exposure in logs |
| Scope | Single tenant; processor-path notification simulation; no real notify/rotate |
| Result | `BREACH_TABLETOP_PASS` |
| Owner | Operator (sole prop) |
| Next rehearsal | ≤ quarterly per checklist Q3 |

**External ticket:** `EXTERNAL_RECORD_OPERATOR_ACTION_REQUIRED` — copy worksheet fields into internal ticket **outside git** (no PII/secrets).

---

## Phase 6 — DSAR ACCESS + ERASURE tabletop — DO NOT RERUN

Prior paper drill retained (`DSAR_TABLETOP_PASS`). External record:

| Field | Value |
|-------|-------|
| Date | 2026-09-02 |
| Scenario | Fictional Art. 15 ACCESS + Art. 17 ERASURE dry-run (Alex Example) |
| Scope | Paper only; invoices/E-Invoice excluded; no delete |
| Result | `DSAR_TABLETOP_PASS` |
| Owner | Operator (sole prop) |
| Next rehearsal | ≤ quarterly per checklist Q4 |

**External ticket:** `EXTERNAL_RECORD_OPERATOR_ACTION_REQUIRED`.

---

## Phase 7 — Retention review (FINAL)

| Check | Evidence | Result |
|-------|----------|--------|
| Auto-delete enabled? | `processRetentionCleanupJob` → `autoDeleteEnabled: false` | **NO** |
| Defaults simulation? | `ensureDefaultRetentionRules` inserts `simulation_only: true` | **YES** |
| Invoices / E-Invoice blind purge? | `docs/retention.md` `LEGAL_HOLD_STATUTORY` / never via retention job | **NOT blindly purged** |

**Result:** `RETENTION_SAFETY_CONFIRMED`

---

## Phase 8 — Privacy contacts (FINAL)

| Address | Code source | Mailbox proven? |
|---------|-------------|-----------------|
| legal@auroranexis.com | `COMPANY_CONTACT.legalEmail` | `MAILBOX_OPERATOR_CONFIRMATION_REQUIRED` |
| privacy@auroranexis.com | `COMPANY_CONTACT.privacyEmail` | `MAILBOX_OPERATOR_CONFIRMATION_REQUIRED` |
| security@auroranexis.com | `COMPANY_CONTACT.securityEmail` | `MAILBOX_OPERATOR_CONFIRMATION_REQUIRED` |
| support@auroranexis.com | `COMPANY_CONTACT.supportEmail` | `MAILBOX_OPERATOR_CONFIRMATION_REQUIRED` |

**Tiny checklist (no auto test emails from this agent):**

1. Confirm each address exists / catches at provider.  
2. Confirm monitoring owner + response SLA.  
3. File one internal note with date (no secrets).  
4. Only then mark `MAILBOX_MONITORING_CONFIRMED`.

---

## Phase 9 — AI operator readiness

| Item | Status |
|------|--------|
| Public `/docs/ai-literacy` | Engineering complete |
| OpenAI production enablement | **ACTIVE_CONFIRMED** (configured; health `ai:true`); no paid call from this pass |
| Labels `AI_ACT_COMPLIANT` / `CERTIFIED` / `LEGAL_APPROVED` | **Not asserted** |
| Art. 50 / Art. 4 legal sufficiency | `COUNSEL_REVIEW_REQUIRED` |

---

## Phase 10 — Cookie / analytics (FINAL)

| Provider | Closure | Notes |
|----------|---------|-------|
| GA4 | `CONFIGURED_STATUS_UNKNOWN` | Env present; consent-gated; not observed anonymous |
| PostHog | `CONFIGURED_STATUS_UNKNOWN` | Env present; consent-gated; not observed anonymous |
| Plausible | `INACTIVE_CONFIRMED` | Env absent |
| Clarity | `CONFIGURED_STATUS_UNKNOWN` | Env present; consent-gated; not observed anonymous |
| Sentry | `CONFIGURED_STATUS_UNKNOWN` | `SENTRY_DSN` present; traffic not attested |

---

## Phase 11 — Public claim drift

| Finding | Rating |
|---------|--------|
| Public legal surfaces not rewritten this pass | Freeze held |
| Internal FastSpring-as-active-MoR docs | **Repaired** (see Phase 12) |

**Public claim risk:** no new `P1_PUBLIC_CLAIM_RISK` proven.  
**No public copy rewritten.**

---

## Phase 12 — FastSpring / MoR doc drift (REPAIRED)

Repaired **internal** docs that presented FastSpring as **current** active MoR / sole billing:

| File | Action |
|------|--------|
| `docs/compliance/README.md` | Mollie PSP / seller; FastSpring HISTORICAL |
| `docs/compliance/compliance-evidence-index.md` EVD-BILL-001 | Mollie PSP; FastSpring HISTORICAL_ONLY |
| `docs/compliance/data-act-portability-baseline.md` | Mollie PSP / HISTORICAL FastSpring |
| `docs/deployment.md` | Mollie-only; Mollie webhook; FastSpring 410 HISTORICAL |
| `docs/architecture.md` | Mollie sole active; diagram + plans + diagnostics |
| `docs/customer-journey.md` | Mollie checkout |
| `docs/compliance/counsel-review-index.md` §11 | Marked FastSpring MoR doc drift REMEDIATED |

**Post-fix grep:** `CURRENT_FALSE=0` for patterns asserting FastSpring as current active MoR / sole billing / FastSpring-only deploy path.  
**Mollie = PSP, not MoR.** Runtime/public legal pages untouched.

---

## Phase 13 — Closable split (unchanged counsel list)

### OPERATOR-CLOSABLE — closure matrix

| # | Item | Result |
|---|------|--------|
| 1 | OPTIONAL providers Y/N | See Phase 2 — mixed CONFIRMED / UNKNOWN (not all ACTIVE_CONFIRMED) |
| 2 | Vercel + Supabase regions | Vercel `iad1` **CONFIRMED** (not EU); Supabase `eu-central-1` **CONFIRMED** |
| 3 | Mailbox monitoring | `MAILBOX_OPERATOR_CONFIRMATION_REQUIRED` |
| 4 | Live Compliance / marketing / imprint | Compliance: `OPERATOR_BROWSER_CHECK_REQUIRED` @ `https://www.auroranexis.com/dashboard/compliance` (login redirect). Marketing: `MARKETING_CONSENT_LIVE_PASS`. Imprint: `IMPRINT_LIVE_PASS` |
| 5 | Tabletop external tickets | `EXTERNAL_RECORD_OPERATOR_ACTION_REQUIRED` |
| 6 | Admin access review | `ADMIN_ACCESS_PROCEDURE_READY` + `OPERATOR_ACCOUNT_REVIEW_REQUIRED` (`operator-admin-access-review.md`) |
| 7 | FastSpring MoR internal drift | **REPAIRED**; `CURRENT_FALSE=0` |
| 8 | Retention auto-delete disabled | `RETENTION_SAFETY_CONFIRMED` |

### COUNSEL-ONLY (list unchanged — stays open)

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

## Live checks detail

### Compliance center (M1)

- URL: `https://www.auroranexis.com/dashboard/compliance`
- Evidence: HEAD/GET resolves to `https://www.auroranexis.com/login?redirect=/dashboard/compliance`
- Result: `OPERATOR_BROWSER_CHECK_REQUIRED`
- Checklist after login: open GDPR requests queue; security incidents list; retention panel shows simulation-only; **do not** assert certified/compliant badges.

### Marketing consent (M3)

- `/contact`: `name="marketingConsent"` checkbox present; **no** `checked` attribute (`checked_on_marketing=0`).
- `/pricing`: newsletter path includes `marketingConsent`; **unchecked** in HTML source.
- Result: `MARKETING_CONSENT_LIVE_PASS` (HTML/source only; no submit).

### Imprint (A6)

- URL: `https://www.auroranexis.com/imprint` HTTP 200
- Markers present: Auroranexis AI Solutions; István-Tamás Schneller; Im Malerwinkel 4; 71566 Althütte; DE449657077; Einzelunternehmen / Sole proprietorship
- Result: `IMPRINT_LIVE_PASS` (accuracy vs live HTML — **not** legal sufficiency).

---

## Open priorities (FINAL OPERATOR CLOSURE PASS)

| Class | Items |
|-------|-------|
| OPEN P0 | **None proven** |
| ENGINEERING P1 | **None new** — no runtime changes; P1-002 live billing **not started** |
| OPERATOR P1 | Mailbox monitoring proof; browser Compliance center spot-check; external tabletop tickets; admin account attestation; optional configured providers runtime/consent attestation (Sentry/GA4/PostHog/Clarity) |
| COUNSEL-ONLY | Phase 13 list unchanged (10 items) |

---

## FINAL OPERATOR CLOSURE PASS — verdict block

```text
VERDICT: OPERATOR_P1_MANUAL_CONFIRMATION_REQUIRED
READY_TO_START_P1_002 = NO
Pushed: NO
Deployed: NO
```

Rationale: closable engineering/docs items advanced (regions, imprint, marketing consent HTML, retention safety, FastSpring internal MoR drift). Remaining operator P1 confirmations (mailboxes, Compliance center browser check, external tabletop records, admin account attestation, optional-provider runtime attestation) block declaring operator P1 fully closed and block `READY_TO_START_P1_002=YES`.

---

## Validation

- Intentional file changes: this execution record; `operator-admin-access-review.md`; FastSpring/MoR internal doc repairs listed in Phase 12; counsel-review-index §11 remediation note.
- Build skipped (Markdown-only).
- Absolute freeze: **YES**.
- Pushed: **NO**. Deployed: **NO**.
- P1-002: **NOT STARTED**.
