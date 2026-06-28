# Functional QA Audit — Sprint 10

**Version:** Auroranexis v0.9 RC  
**Date:** 2025-06-23  
**Scope:** Code-path and UI audit — no new features  
**Method:** Static analysis of routes, server actions, list/detail pages, and RBAC guards

## Summary

| Module | Create | Read | Update | Archive/Delete | Filters | Search | Verdict |
|--------|--------|------|--------|----------------|---------|--------|---------|
| Clients | PASS | PASS | PASS | WARN | PASS | WARN | **PASS** |
| Reports | PASS | PASS | PASS | PASS | PASS | WARN | **PASS** |
| Risks | PASS | PASS | PASS | PASS | PASS | WARN | **PASS** |
| Incidents | PASS | PASS | PASS | PASS | PASS | WARN | **PASS** |
| Automation | PASS | PASS | PASS | PASS | PASS | N/A | **PASS** |
| Integrations | PASS | PASS | PASS | PASS | N/A | N/A | **PASS** |
| Connectors | PASS | PASS | PASS | PASS | N/A | N/A | **PASS** |
| Public API | PASS | PASS | PASS | PASS | N/A | N/A | **PASS** |
| Compliance | PASS | PASS | PASS | N/A | PASS | PASS | **PASS** |
| Billing | PASS | PASS | PASS | N/A | PASS | N/A | **PASS** |
| White Label | PASS | PASS | PASS | N/A | N/A | N/A | **PASS** |

**Overall:** All major modules have complete CRUD or lifecycle paths. Gaps are search UX (global search only) and soft-delete semantics (archive, not hard delete).

---

## Clients

| Check | Result | Evidence |
|-------|--------|----------|
| Create | PASS | `createClientAction` → `/clients/new` |
| Edit | PASS | `updateClientAction` on detail page |
| Archive | PASS | `archiveClientAction` — status → `archived` |
| Delete | WARN | No hard delete; archive is the destructive path (by design) |
| Filters | PASS | `ArchiveFilterTabs` on `/clients` (`?archived=1`) |
| Search | WARN | No list-level search; global search may surface clients |

---

## Reports

| Check | Result | Evidence |
|-------|--------|----------|
| Create | PASS | `createReportAction` → `/reports/new` |
| Template prefill | PASS | Template picker on new report + `report-templates` module |
| AI assistant | PASS | `ReportEditableWithAI` / `report-ai-provider.tsx` (plan-gated) |
| Publish | PASS | `publishReportAction`, publish workflow migration |
| Export | PASS | PDF via `src/lib/reports/pdf.ts` |
| Schedules | PASS | `report-schedules` CRUD + generate draft |
| Email send | PASS | `send-report-email-button.tsx`, delivery tables |
| PDF generation | PASS | Server-side pdfkit export |

---

## Risks

| Check | Result | Evidence |
|-------|--------|----------|
| CRUD | PASS | `createRiskAction`, `updateRiskAction`, `resolveRiskAction`, `archiveRiskAction` |
| AI Copilot | PASS | Risk detail AI panel (plan-gated) |
| Mitigation generation | PASS | AI actions on risk detail |
| Status changes | PASS | Resolve + archive flows with activity logging |

---

## Incidents

| Check | Result | Evidence |
|-------|--------|----------|
| CRUD | PASS | `createIncidentAction`, `updateIncidentAction`, `resolveIncidentAction`, `archiveIncidentAction` |
| Root cause analysis | PASS | RCA fields on incident detail + AI assistance |
| Updates | PASS | Status/timeline updates on detail page |
| SLA integration | PASS | SLA policies + `processOrganizationSlaAlerts` on dashboard |

---

## Automation

| Check | Result | Evidence |
|-------|--------|----------|
| Builder | PASS | `/automation/new`, `/automation/[id]` with dynamic builder |
| Workflow execution | PASS | `executeWorkflowAction` in engine v2 |
| Simulations | PASS | `recordSimulationAction` |
| Execution history | PASS | Execution tables + detail in automation UI |
| Versions | PASS | `restoreWorkflowVersionAction`, version table |

---

## Integrations

| Check | Result | Evidence |
|-------|--------|----------|
| Catalog | PASS | `/automation/integrations` provider registry |
| Vault | PASS | `/automation/integrations/secrets` |
| OAuth | PASS | Connector OAuth routes (see security audit) |
| Health | PASS | Integration runtime diagnostics |
| Sync | PASS | Delivery logs + simulation paths |

---

## Connectors

| Check | Result | Evidence |
|-------|--------|----------|
| Connect | PASS | OAuth authorize/callback routes |
| Disconnect | PASS | `revokeConnectorConnectionAction` |
| Sync | PASS | `runConnectorSyncAction` |
| Refresh | PASS | Token refresh in `oauth/storage.ts` |
| Token expiry | PASS | Expiry tracking in connector diagnostics |

---

## Public API

| Check | Result | Evidence |
|-------|--------|----------|
| Keys | PASS | `createApiKeyAction`, hashed storage |
| Scopes | PASS | 16 scopes in `src/lib/api/types.ts` |
| OpenAPI | PASS | OpenAPI version in diagnostics + `/api/v1` routes |
| Rate limits | PASS | Per-key sliding window (in-memory; see performance audit) |

---

## Compliance

| Check | Result | Evidence |
|-------|--------|----------|
| Evidence | PASS | `exportEvidenceAction`, governance evidence module |
| Exports | PASS | `exportAuditAction`, audit exports table |
| GDPR requests | PASS | `createGdprRequestAction`, status updates |
| Audit explorer | PASS | `/dashboard/compliance/audit` with filters |

---

## Billing

| Check | Result | Evidence |
|-------|--------|----------|
| Invoices | PASS | `customer_invoices` + billing dashboard |
| Discounts | PASS | `validateDiscountCodeAction`, `discount_codes` table |
| Usage | PASS | `/settings/usage`, usage metering v2 |
| Forecasts | PASS | Forecast status in billing diagnostics |

---

## White Label

| Check | Result | Evidence |
|-------|--------|----------|
| Branding | PASS | `/settings/branding`, white-label workspace |
| Publish | PASS | `publishWhiteLabelSettingsAction` |
| Assets | PASS | Storage bucket `white-label-assets` |
| Portal | PASS | Client portal with published branding |

---

## Manual QA recommended before pilot

1. End-to-end Stripe checkout in test mode
2. Send report email with real SMTP/Resend
3. OAuth connect one connector in staging
4. Run compliance audit export with real data volume
5. Verify portal user login scoped to single client

## Related

- [testing.md](./testing.md)
- [e2e-results.md](./e2e-results.md)
- [launch-readiness-report.md](./launch-readiness-report.md)
