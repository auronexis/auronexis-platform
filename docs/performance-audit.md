# Performance Audit — Sprint 10

**Version:** Auroranexis v0.9 RC  
**Date:** 2025-06-23  
**Target:** Sub-300ms common pages (server TTFB + data fetch, excluding AI provider latency)

## Summary

| Area | Result |
|------|--------|
| N+1 query patterns | **WARN** (1 critical path) |
| Duplicate fetches | **WARN** |
| Large client bundles | **WARN** |
| Route loading UI | **PASS** (improved Sprint 10) |
| Bundle dependencies | **PASS** |
| Focus pages | **WARN** |

**Verdict:** Acceptable for pilot/demo workloads. Dashboard and client-success AI paths need optimization before high-volume production.

---

## Critical: client-success N+1

**Location:** `src/lib/ai/client-success/portfolio.ts`

Sequential loop calls `buildClientSuccessSnapshot()` per client — ~25 queries each. With *N* clients → **O(N × 25)** queries when `ai_client_analysis` is enabled on dashboard.

**Recommendation:** Batch snapshot query or cap to top-N clients; cache plan resolution.

---

## Uncached plan resolution — WARN

`canUseFeature()` and `checkPlanFeatureForSession()` each call `getCurrentPlan()` without React `cache()`.

Dashboard page may perform **~12 identical subscription reads** per load (6 in `getDashboardData`, 6 in page component).

**Recommendation:** Wrap `getOrganizationPlanContext` in `cache()`.

---

## SLA/escalation on read path — WARN

`getDashboardData()` runs `processOrganizationSlaAlerts` and `processOrganizationReportOverdueEscalations` on every dashboard visit — adds latency and write load.

**Recommendation:** Move to scheduled job (see database audit).

---

## Duplicate metadata fetches — WARN

Detail pages with `generateMetadata` + page body both fetch entity (`reports/[id]`, `clients/[id]`, etc.). `requireSession()` is cached; entity fetch is not.

**Recommendation:** Wrap entity getters in `cache()` or combine metadata fetch.

---

## Route loading UI — PASS (Sprint 10)

| Route | Loading boundary |
|-------|------------------|
| `(dashboard)/loading.tsx` | Generic skeleton |
| `reports/loading.tsx` | Added Sprint 10 |
| `automation/loading.tsx` | Added Sprint 10 |
| `settings/billing/loading.tsx` | Added Sprint 10 |

Portal and compliance routes still inherit parent loader only.

---

## Client bundle weight — WARN

| Component | Lines | Impact |
|-----------|-------|--------|
| `report-ai-provider.tsx` | ~678 | Loaded on report detail |
| `diagnostics-panel.tsx` | ~739 | Settings diagnostics |
| `white-label-workspace.tsx` | ~455 | Branding editor |

**PASS:** Automation builder uses `next/dynamic`. Dependencies lean (no Recharts/Lodash).

---

## Focus page assessment

| Page | Latency risk | Notes |
|------|--------------|-------|
| Dashboard | HIGH | Plan duplication + optional client-success N+1 + SLA processors |
| Reports list | LOW | Single `listReports` query |
| Report detail | MEDIUM | 8-way `Promise.all` good; AI bundle heavy |
| Automation hub | MEDIUM | Client-side store reload duplicates server work |
| Billing | LOW–MED | Parallel fetch; duplicate plan context on billing page |
| Usage | LOW | Cached dashboard data + parallel metrics |
| Compliance | LOW | Single snapshot queries |

---

## API latency

Public API rate limiting is in-memory per instance. Average latency tracked in diagnostics from `api_request_logs`.

---

## Optimization backlog (non-blocking for pilot)

1. Cache `getOrganizationPlanContext` / `getCurrentPlan`
2. Fix client-success portfolio N+1
3. External cron for SLA/schedules/sync
4. Lazy-load `report-ai-provider` on report detail
5. `UNIQUE(stripe_event_id)` for webhook dedup

## Related

- [database-audit.md](./database-audit.md)
- [launch-readiness-report.md](./launch-readiness-report.md)
