# Pricing Assumptions — v0.99

**Date:** 2025-06-23  
**Used by:** [cost-analysis.md](./cost-analysis.md), [runway-analysis.md](./runway-analysis.md), [pilot-budget.md](./pilot-budget.md)

---

## Plan pricing (EUR, monthly)

| Plan | List price | Target segment |
|------|------------|----------------|
| Starter | €79 | Solo agencies |
| Professional | €249 | Core pilot tier |
| Business | €499 | Multi-team agencies |
| Enterprise | Custom | White-label + SLA |

Public marketing pricing: `/pricing`  
In-app plan management: `/settings/plans`

---

## Revenue assumptions

### Bootstrap (0 customers, 3 pilots)

| Source | Assumption |
|--------|------------|
| Paying customers | 0 |
| Pilots | 3 @ 50% off Professional |
| Pilot MRR | 3 × €125 = **€375** (if all convert at discount) |
| Actual bootstrap MRR | **€0** until pilots sign |

### Early stage (10 customers)

| Mix | Count | MRR |
|-----|-------|-----|
| Starter | 2 | €158 |
| Professional | 6 | €1,494 |
| Business | 2 | €998 |
| **Total** | 10 | **~€2,650** |

Conservative model uses **€2,490** (~avg €249) for infra planning.

### Growth (50 customers)

| Mix | MRR (approx.) |
|-----|---------------|
| 50 × blended €200 avg | **~€10,000** |

---

## Stripe fee model

| Fee type | Rate |
|----------|------|
| EU card | 1.5% + €0.25 |
| Non-EU card | 2.9% + €0.25 |
| Planning average | **2.5% + €0.25** per invoice |

Example Professional invoice:

- Gross: €249
- Stripe fee: ~€6.48
- Net: ~€242.52

---

## Pilot discount

| Coupon | Discount | Duration |
|--------|----------|----------|
| `PILOT50` | 50% | 6 months |

Post-pilot: full list price or negotiated Business tier.

---

## AI cost allocation

| Plan | AI budget assumption |
|------|---------------------|
| Starter | Minimal (upgrade prompts) |
| Professional | ~€2–5/mo OpenAI cost |
| Business | ~€5–15/mo |
| Enterprise | Custom cap |

AI costs scale with usage; plan gates limit exposure.

---

## Break-even formulas

```
Infra break-even customers = Monthly infra cost ÷ Net revenue per customer
                           ≈ €50 ÷ €242 ≈ 0.21 customers
```

```
Early-stage margin = MRR − infra − Stripe fees
                   ≈ €2,490 − €120 − €75 ≈ €2,295/mo (before salary)
```

---

## Related

- [pricing-beta.md](./pricing-beta.md)
- [billing.md](./billing.md)
- [platform-costs.md](./platform-costs.md)
