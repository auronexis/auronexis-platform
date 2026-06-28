# Runway Analysis — Auroranexis

**Date:** 2025-06-23  
**Version:** v0.99.0  
**Companion:** [runway.md](./runway.md) (executive summary)

---

## Purpose

Estimate how long bootstrap infrastructure spend is sustainable before recurring revenue covers costs.

---

## Bootstrap burn (monthly)

| Item | Conservative (€) | Comfortable (€) |
|------|------------------|-----------------|
| Platform infra | 15 | 50 |
| Domain | 1 | 1 |
| Contingency (10%) | 2 | 5 |
| **Monthly burn** | **~18** | **~56** |

Excludes founder salary, legal, and marketing spend.

---

## Runway scenarios

Assuming **€0 revenue** (pre-pilot):

| Cash reserve | @ €18/mo | @ €56/mo |
|------------|----------|----------|
| €500 | 27 months | 9 months |
| €1,000 | 55 months | 18 months |
| €2,000 | 111 months | 36 months |

Assuming **€375/mo pilot revenue** (3 pilots × €125 net after 50% discount):

| Cash reserve | Net burn €0 | Runway |
|------------|-------------|--------|
| Any | Infra covered | Indefinite on infra alone |

---

## Revenue milestones

| Milestone | MRR | Covers infra? |
|-----------|-----|---------------|
| 1 Professional customer | €249 | Yes |
| 3 discounted pilots | ~€375 | Yes |
| 10 customers (mix) | ~€2,000+ | Yes + margin |
| 50 customers | ~€10,000+ | Growth tier affordable |

---

## Risk factors

| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase egress spike | +€20–50/mo | Monitor dashboard |
| AI usage spike | +€20–100/mo | Plan limits enforced |
| Vercel Pro required for cron SLA | +€20/mo | Budget in pilot phase |
| Stripe live before product ready | Reputation | Staging test matrix first |

---

## Recommendations

1. **Months 0–3:** Stay on free tiers; target **€35/mo** actual spend
2. **First pilot signed:** Upgrade Supabase Pro (€23) for backups
3. **3+ paying customers:** Vercel Pro + Sentry paid if error volume grows
4. **Reinvest margin** into support tooling, not infra, until 20+ customers

---

## Related

- [cost-analysis.md](./cost-analysis.md)
- [pilot-budget.md](./pilot-budget.md)
- [pricing-assumptions.md](./pricing-assumptions.md)
