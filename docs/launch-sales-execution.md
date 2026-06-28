# Launch Sales Execution — v1.0.3

**Version:** 1.0.3  
**Status:** Launch Candidate

## Targets

| Metric | Target |
|--------|--------|
| Outreach sent | 20 |
| Discovery calls | 5 |
| Pilots | 2 |
| Customers | 1 |

Defined in `src/lib/sales/launch-execution-targets.ts`  
Dashboard: `/sales/launch`

## Top 100 agencies

Segments (100 total):

| Segment | Count |
|---------|-------|
| DACH MSP | 25 |
| DACH Automation | 25 |
| DACH AI | 25 |
| Germany GRC Agency | 25 |

Seed data: `src/lib/sales/top100-agencies.ts`  
Populate CRM: **Populate Top 100 agencies** on `/sales/launch`

## Execution workflow

1. Seed Top 100 leads with region and agency type
2. Run outbound from `/sales/outbound` using templates
3. Move replies to discovery call stage
4. Generate proposals at `/sales/proposals`
5. Track won deals on `/sales/execution`
