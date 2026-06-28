# Sales Execution — v1.0.2

**Route:** `/sales/execution`  
**Implementation:** `src/lib/sales/sales-execution-metrics.ts`

## Dashboard metrics

| Metric | Source |
|--------|--------|
| Outreach sent | `sales_lead_activities` (email, outreach) |
| Replies | reply activities + `reply_received_at` |
| Meetings | discovery stage + meeting activities |
| Discovery calls | `discovery_call` pipeline stage |
| Pilots | `pilot_application` stage |
| Won deals | `won` stage |
| MRR / ARR | Sum of won lead MRR |

## First customer metrics (same page)

- Time to close
- Pilot conversion
- Average deal size
- Revenue forecast
- Customer satisfaction (portal feedback)

## Weekly targets

| Metric | Target |
|--------|--------|
| Outreach sent | 50+ |
| Replies | 10+ |
| Discovery calls | 5+ |
| Proposals sent | 2+ |
| Won deals | 1 |
