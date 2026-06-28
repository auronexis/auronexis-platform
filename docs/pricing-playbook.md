# Pricing Playbook — v1.0.0

## Public plans

Published on `/pricing` and in-app Settings → Plans.

## Pilot discount

- **50% beta pricing** for 6 weeks (founding program)
- **Lifetime discount** for first 10 founding customers
- Discount codes managed in `discount_codes` table

## Sales talk track

1. Anchor on operational value (client health, reports, automation)
2. Compare plan tiers to agency size
3. Offer pilot as low-risk entry
4. Emphasize founding slot scarcity (10 companies)

## MRR estimation

On each lead record:

- `mrr_estimate` — expected monthly subscription
- `lead_value` — total contract value (pilot + annual)

Pipeline dashboard aggregates **MRR Pipeline** from active stages.

## Proposal structure

Use in-app **Commercial Proposal Template**:

1. Executive summary
2. Pain points (from lead record)
3. Auroranexis solution fit
4. Plan recommendation
5. Pilot terms + founding offer
6. Timeline and next steps

## Objection handling

| Objection | Response |
|-----------|----------|
| Too early | Pilot is 6 weeks, 50% off, no long commitment |
| Using other tools | Position as operations layer, not replacement |
| Budget | ROI worksheet — hours saved × blended rate |
