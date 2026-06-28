# Revenue Readiness — v1.0.0

**Target score:** ≥ 99  
**Label:** Revenue Ready

## Dimensions

| Dimension | Weight | Checks |
|-----------|--------|--------|
| Sales readiness | 33% | Pipeline stages, inbox, assets, booking, CRM tables |
| Customer readiness | 33% | Founding program (10 slots), benefits, pilot stages |
| Revenue readiness | 33% | v1.0.0 version, won/lost stages, pricing assets |

## In-app diagnostics

Settings → Diagnostics → **Revenue readiness**

Fields:

- Overall score
- Sales / Customer / Revenue sub-scores
- Pipeline stages configured
- Lead capture configured
- Contact inbox configured
- Founding program configured
- Sales assets ready
- Booking links configured
- CRM tables ready
- Version v1.0.0

## Pass criteria

```
score >= 99 → label "Revenue Ready"
score < 99  → label "Revenue Incomplete"
```

## Implementation

`src/lib/diagnostics/revenue-readiness.ts`

Probes:

- Static config (pipeline, inboxes, assets, founding limit)
- Supabase `sales_leads` table existence
- `APP_VERSION.startsWith("1.0.0")`
- Calendly or Google Calendar env (dev bypass allowed)

## Pre-launch checklist

- [ ] Run migration `20250625000000_revenue_pipeline.sql`
- [ ] Set `PLATFORM_SALES_ORG_ID`
- [ ] Configure `CALENDLY_DISCOVERY_URL` or `GOOGLE_CALENDAR_DISCOVERY_URL`
- [ ] Verify Resend sends to sales@ / info@
- [ ] Submit test pilot application
- [ ] Confirm lead appears in `/sales`
- [ ] Diagnostics shows **Revenue Ready**

## Status

**v1.0.0 — Revenue Ready** (when all checks pass)
