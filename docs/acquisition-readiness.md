# Acquisition Readiness — v1.0.1

**Target score:** ≥ 99  
**Label:** Customer Acquisition Ready

## Dimensions

| Dimension | Weight | Checks |
|-----------|--------|--------|
| Sales readiness | 25% | Pipeline, inbox, assets, booking, pilot stages |
| Acquisition readiness | 25% | Outbound lists, enrichment, templates, automation, docs, tables |
| Revenue readiness | 25% | v1.0.1, won/lost stages, pricing, founding program |
| Customer success readiness | 25% | Onboarding checklist, milestones, CS templates |

## In-app diagnostics

Settings → Diagnostics → **Acquisition readiness**

Fields:

- Overall score
- Sales / Acquisition / Revenue / Customer success sub-scores
- Outbound lists configured
- Lead enrichment configured
- Outreach templates configured
- Sales automation configured
- Customer success configured
- Acquisition tables ready
- Acquisition docs ready
- Version v1.0.1

## Pass criteria

```
score >= 99 → label "Customer Acquisition Ready"
score < 99  → label "Customer Acquisition Incomplete"
```

## Implementation

`src/lib/diagnostics/acquisition-readiness.ts`

Probes:

- Static config (lists, templates, enrichment fields, automation rules)
- Supabase `outbound_lists`, `customer_success_records`, `sales_lead_reminders`
- Eight docs in `docs/`
- `APP_VERSION.startsWith("1.0.1")`

## Pre-launch checklist

- [ ] Run migration `20250625100000_customer_acquisition.sql`
- [ ] Verify `/sales/acquisition`, `/sales/outbound`, `/sales/templates`, `/sales/success`
- [ ] Confirm outreach templates render
- [ ] Run automation scan once
- [ ] Diagnostics shows **Customer Acquisition Ready**

## Status

**v1.0.1 — Customer Acquisition Ready** (when all checks pass)
