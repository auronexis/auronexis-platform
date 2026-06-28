# Launch Candidate Metrics — v1.0.3

**Version:** 1.0.3  
**Status:** Launch Candidate

## Readiness score

| Dimension | Target |
|-----------|--------|
| Overall launch candidate | ≥ 99 |
| Deployment | ≥ 95 |
| Supabase production | ≥ 99 |
| Vercel production | ≥ 99 |
| Sales execution | ≥ 95 |
| Onboarding verification | ≥ 99 |
| Security | ≥ 95 |
| Revenue | ≥ 90 |

## Sales KPIs (Sprint 0)

| KPI | Target | Source |
|-----|--------|--------|
| Outreach | 20 | `sales_lead_activities` |
| Discovery calls | 5 | Pipeline stage `discovery_call` |
| Pilots | 2 | Pipeline stage `pilot_application` |
| Customers | 1 | Pipeline stage `won` |

## Infrastructure KPIs

- Health API latency < 500ms
- Cron success rate > 99%
- Queue backlog = 0 at launch
- Zero critical security findings in diagnostics

## Reporting

Review weekly in Settings → Diagnostics → **Launch candidate readiness** and `/sales/launch`.
