# First Customer Readiness — v1.0.2

**Target score:** ≥ 99  
**Label:** First Customer Ready

## Dimensions

| Dimension | Weight | Checks |
|-----------|--------|--------|
| Customer readiness | 25% | Version, regions, agency types, top 100 target, pipeline |
| Sales execution | 25% | Templates, execution metrics, proposals table |
| Delivery readiness | 25% | Proposal content, ROI, timeline, docs |
| Onboarding readiness | 25% | Kickoff workflow, checklist, portal milestones |

## In-app diagnostics

Settings → Diagnostics → **First customer readiness**

## Pass criteria

```
score >= 99 → label "First Customer Ready"
```

## Implementation

`src/lib/diagnostics/first-customer-readiness.ts`

## Pre-launch checklist

- [ ] Run migration `20250625200000_first_customer.sql`
- [ ] Verify `/sales/execution`, `/sales/sourcing`, `/sales/proposals`, `/sales/onboarding`
- [ ] Verify `/client-portal/onboarding`
- [ ] Generate test proposal PDF
- [ ] Diagnostics shows **First Customer Ready**

## Status

**v1.0.2 — First Customer Ready** (when all checks pass)
