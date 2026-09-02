# Operator Compliance Checklist — sole proprietorship / small SaaS

**Status:** `OPERATOR_REVIEW_REQUIRED`  
**Entity scale:** Auroranexis AI Solutions — German Einzelunternehmen  
**Principle:** Proportionate cadence. Not an enterprise GRC platform mandate.

Related: breach runbook, DSAR playbooks, subprocessor change procedure, tabletops in this pack.

---

## MONTHLY

| # | Action | Evidence |
|---|--------|----------|
| M1 | Review open GDPR requests / security incidents in Compliance center | Dashboard statuses |
| M2 | Skim Sentry/error volume for unexpected PII in events (if Sentry enabled) | Monitoring console |
| M3 | Confirm marketing consent path still unchecked-by-default on live forms (spot check) | Newsletter / contact |
| M4 | Verify backup/status of production deploy + domain health (ops) | Vercel / status |
| M5 | Check legal@ / privacy@ / security@ mailboxes for DSAR / CVD / counsel mail | Inbox |

## QUARTERLY

| # | Action | Evidence |
|---|--------|----------|
| Q1 | Diff public `/subprocessors` vs `subprocessors-inventory.ts` version after any provider change | Version + effective date |
| Q2 | Re-read DPA version string vs acceptance records if customers accepted older versions | `DPA_DOCUMENT_VERSION` |
| Q3 | Run **or schedule** breach tabletop (`TABLETOP_READY_NOT_EXECUTED` → executed record) | `operator-breach-tabletop.md` |
| Q4 | Run **or schedule** DSAR tabletop for one right (access or erasure dry-run) | `operator-dsar-tabletop.md` |
| Q5 | Attest OPTIONAL provider enablement Y/N (Sentry, GA4, PostHog, Plausible, Clarity, OpenAI, Resend) | Internal attestation sheet |
| Q6 | Review Privacy / Cookies / Security Policy for claim drift vs `legal-claims-register.md` | Counsel if rewriting |
| Q7 | Retention overview: confirm simulation-only still true; no accidental auto-delete enablement | `/dashboard/compliance` + `docs/retention.md` |

## ANNUALLY

| # | Action | Evidence |
|---|--------|----------|
| A1 | External counsel refresh: DPA, transfers, RoPA, DPIA decision, AI Act Art. 4/50 | Signed counsel memo (external) |
| A2 | Update RoPA groundwork if processing/processors changed | `ropa-*-review.md` |
| A3 | Revisit DPIA screening triggers (AI scope, analytics, profiling) | `dpia-counsel-review.md` |
| A4 | Access review: who has production Supabase/Vercel/Mollie admin | Ops password manager |
| A5 | Dependency / vulnerability posture review (high-level) | CI / advisory process |
| A6 | Imprint / company information accuracy (address, VAT, contacts) | `company-information.ts` / imprint |

## EVENT-DRIVEN

| Trigger | Action |
|---------|--------|
| New subprocessor or region change | Follow `docs/billing/subprocessor-change-procedure.md`; bump inventory version; customer notice if DPA requires |
| Personal data breach suspected | `personal-data-breach-runbook.md` immediately; start 72h assessment if breach confirmed |
| DSAR received | `dsar-operator-playbooks.md`; log in `gdpr_requests` |
| Enable OpenAI / Sentry / GA4 / Clarity / etc. | Update attestation; counsel transfer/DPIA check if first enablement |
| Disable or withdraw marketing tool | Confirm consent teardown / fail-closed still holds |
| Customer offboarding | Export/delete assistance per DPA §16; statutory billing retention carve-out |
| Public claim challenge | Check `legal-claims-register.md`; do not assert certifications |
| Counsel delivers written approval/redlines | Store outside git if privileged; schedule controlled copy update (separate engineering change control) |

---

## Explicit non-goals

- No fake “monthly GDPR certification”  
- No requirement to run full pen-tests monthly  
- No automated legal approval from completing this checklist
