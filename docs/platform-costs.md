# Platform Costs — v0.99

**Date:** 2025-06-23  
**Version:** Auroranexis v0.99.0  
**Currency:** EUR (approximate; USD services converted at ~0.92)

Executive summary of monthly infrastructure spend. Detailed scenarios in [cost-analysis.md](./cost-analysis.md).

---

## Current spend (bootstrap — estimated)

| Service | Tier | Monthly (€) |
|---------|------|-------------|
| Vercel | Hobby / Pro (1 seat) | 0–20 |
| Supabase | Free → Pro | 0–25 |
| Stripe | Pay-per-transaction | 0* |
| Sentry | Developer (free) | 0 |
| PostHog | Free (1M events) | 0 |
| Resend | Free tier | 0 |
| Domain (`auroranexis.com`) | Annual ÷ 12 | ~1 |
| SSL | Included (Vercel) | 0 |
| OpenAI | Usage-based | 5–15 |
| OAuth providers | Free | 0 |
| **Estimated total** | | **~15–50** |

\* Stripe charges only on successful payments; bootstrap with 0 customers = €0 platform fee until first revenue.

**Target:** Bootstrap phase ≤ **€100/month** (preferred **€50/month**) — achievable on free tiers with minimal AI usage.

---

## Scenario comparison

| Scenario | Customers | Pilots | Est. monthly (€) |
|----------|-----------|--------|------------------|
| **Bootstrap** | 0 | 3 | 35–65 |
| **Early stage** | 10 | 5 | 120–180 |
| **Growth** | 50 | 10 | 350–550 |

See [cost-analysis.md](./cost-analysis.md) for line-item breakdown.

---

## Cost drivers by scale

| Driver | Bootstrap | Early | Growth |
|--------|-----------|-------|--------|
| Vercel | Hobby | Pro | Pro + bandwidth |
| Supabase | Free | Pro | Pro + storage |
| AI (OpenAI) | Low | Moderate | High |
| Email (Resend) | Free | Starter | Pro |
| Observability | Free tiers | Paid Sentry | Paid PostHog |

---

## Break-even (early stage)

Assumptions in [pricing-assumptions.md](./pricing-assumptions.md):

- Average plan: **€249/month** (Professional)
- Stripe fee: **~2.9% + €0.25** per invoice
- Net per customer: **~€241**

| Milestone | Revenue | Covers infra (~€150) |
|-----------|---------|----------------------|
| 1 paying customer | €249 | Yes |
| 3 pilots (50% discount) | ~€375 | Yes |
| 10 customers | €2,490 | Strong margin |

---

## Optimization levers

1. Stay on Supabase Free until >500 MB DB or 2 GB egress
2. Vercel Hobby until cron + team features require Pro
3. Cap AI usage per plan (already enforced in-app)
4. Batch report emails; avoid redundant OpenAI calls
5. Sentry/PostHog free tiers until pilot feedback phase ends

---

## Related

- [cost-analysis.md](./cost-analysis.md)
- [runway-analysis.md](./runway-analysis.md)
- [pilot-budget.md](./pilot-budget.md)
- [pricing-assumptions.md](./pricing-assumptions.md)
