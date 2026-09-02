# Retention Operator Review

**Status:** `OPERATOR_REVIEW_REQUIRED` / engineering behaviour `ENGINEERING_COMPLETE` (simulation posture)  
**Sources:** [`../retention.md`](../retention.md), `src/lib/compliance/retention.ts`, Privacy Policy retention honesty (P1-07)  
**Rule:** Describe **actual behaviour only**. Do not claim automatic deletion occurs.

Public Privacy Policy must stay aligned: **no claim that automatic deletion currently occurs.**

---

## Platform mechanism

| Mechanism | Actual behaviour |
|-----------|------------------|
| `retention_rules` | Configurable periods (`30d`…`forever`) with `simulation_only: true` by default |
| Cron `retention_cleanup` | Impact **simulation**; `autoDeleteEnabled: false` |
| Legal holds table | `legal_holds` — blocks future enforcement when built; not a live mass-delete engine today |
| Client lifecycle | Archive preferred; restricted hard delete after archive (owner/admin) — **operational** CRM control, **not** certified end-to-end GDPR erasure |

---

## Major datasets — retention class

| Dataset | Class | Actual behaviour (evidence-based) |
|---------|-------|-----------------------------------|
| Sales invoices / billing records | `STATUTORY` | Retained for accounting; **do not** enable destructive auto-delete |
| E-Invoice compliance archive | `STATUTORY` | Immutable archive path; not purged by retention simulation |
| Legal holds | `LEGAL_HOLD` | Registry exists; enforcement of hold-aware delete is future work |
| Client CRM operational records | `CUSTOMER-CONTROLLED` / `SIMULATION_ONLY` | Customer/ops lifecycle (archive/hard-delete controls); retention UI simulates policy coverage |
| Portal users / portal activity | `CUSTOMER-CONTROLLED` / `SIMULATION_ONLY` | Tied to client/ops lifecycle; simulation categories include `portal_activity` |
| Auth accounts / memberships | `MANUAL` | Operator/DSAR/offboarding assisted; not blind cron purge |
| Marketing leads / newsletter | `MANUAL` | Suppression/erasure via DSAR/ops; consent evidence retained as needed |
| Contact / pilot leads | `MANUAL` | Sales pipeline + DSAR playbooks |
| Consent records | `MANUAL` / accountability | Keep withdrawal evidence as required — no blind purge |
| AI request / generation logs | `SIMULATION_ONLY` | Category `ai_logs`; simulation retention |
| Audit events | `SIMULATION_ONLY` / security need | Immutable insert posture; simulation category `audit_events`; prefer retain during investigations |
| Security incidents | `MANUAL` / investigation | Operator-managed; not auto-wiped |
| API logs | `SIMULATION_ONLY` | Category `api_logs` |
| Connector sync history | `SIMULATION_ONLY` | Category `connector_sync_history` |
| Workflow/automation executions | `SIMULATION_ONLY` | Category `executions` |
| Notifications | `SIMULATION_ONLY` | Category `notifications` |
| Knowledge entries | `SIMULATION_ONLY` / `CUSTOMER-CONTROLLED` | Category `knowledge_entries` |
| Reports | `SIMULATION_ONLY` / `CUSTOMER-CONTROLLED` | Category `reports` |
| Mollie PSP / webhook rows | `STATUTORY` / billing integrity | Org-scoped billing artefacts; not cascaded by client hard delete |
| Optional analytics (GA4/PostHog/etc.) | Provider-side + consent withdrawal | Limited Auroranexis control; fail-closed consent architecture |
| Sentry errors | Provider-side + `OPTIONAL` | Scrubbing claimed; retention per provider project |

**Class key used above**

| Code | Meaning |
|------|---------|
| `AUTOMATED` | **Not used** for destructive purge today — no production auto-delete job enabled |
| `MANUAL` | Operator / DSAR / support action required |
| `SIMULATION_ONLY` | Retention module calculates coverage without deleting |
| `STATUTORY` | Legal/accounting retention — exclude from erasure automation |
| `LEGAL_HOLD` | Hold registry / counsel-directed preservation |
| `CUSTOMER-CONTROLLED` | Tenant users control lifecycle within product permissions |

---

## Counsel / operator questions

1. Which German commercial/tax retention periods must be annexed for invoices and e-invoice archive?  
2. When (if ever) may simulation mode be replaced by `AUTOMATED` deletion without breaking statutory or DPA delete/return promises?  
3. Is client hard-delete after archive acceptable as a **partial** erasure tool if playbooks document residual stores?

## Explicit non-claims

- No claim of GDPR-certified erasure completeness via UI delete.  
- No claim of automated retention enforcement in production.
