# Cost Analysis — Auroranexis v0.99

**Date:** 2025-06-23  
**Scope:** Monthly infrastructure and operational costs  
**Target:** Bootstrap ≤ €100/month (preferred €50/month)

---

## Assumptions

- Single founder, EU-based billing
- EUR pricing; USD services at ~0.92 conversion
- Staging + production share Supabase Pro (or free during bootstrap)
- AI via OpenAI `gpt-4o-mini` for report assistant
- No dedicated status page SaaS (in-app `/status` + `/api/health`)

---

## Line items

### Vercel

| Tier | Cost | Includes |
|------|------|----------|
| Hobby | €0 | 100 GB bandwidth, serverless, cron (Pro feature on Hobby limited) |
| Pro | ~€20/seat | Cron jobs, team, analytics, 1 TB bandwidth |

**Bootstrap:** €0–20  
**Early (10 customers):** €20  
**Growth (50 customers):** €20–40 (bandwidth overage possible)

### Supabase

| Tier | Cost | Limits |
|------|------|--------|
| Free | €0 | 500 MB DB, 1 GB storage, 2 GB egress |
| Pro | ~€23 | 8 GB DB, 100 GB storage, 250 GB egress |

**Bootstrap:** €0 (free)  
**Early:** €23 (Pro recommended for backups + SLA)  
**Growth:** €23–75 (compute add-ons if needed)

### Storage & bandwidth

Included in Supabase (files) + Vercel (static assets). White label assets and PDF reports drive storage.

| Scenario | Storage | Bandwidth est. |
|----------|---------|----------------|
| Bootstrap | <1 GB | <10 GB/mo |
| Early | 2–5 GB | 30 GB/mo |
| Growth | 10–25 GB | 150 GB/mo |

### Stripe

- **Platform fee:** None (Stripe charges merchant)
- **Per transaction:** 1.5% + €0.25 (EU cards) or 2.9% + €0.25 (international)
- **Bootstrap (0 revenue):** €0

### Sentry

| Tier | Cost |
|------|------|
| Developer | €0 (5k errors/mo) |
| Team | ~€26/mo |

**Bootstrap:** €0  
**Growth:** €0–26

### PostHog

| Tier | Cost |
|------|------|
| Free | €0 (1M events) |
| Paid | From ~€0.00031/event after free tier |

**Bootstrap:** €0  
**Early:** €0  
**Growth:** €0–50

### Email (Resend)

| Tier | Cost |
|------|------|
| Free | 3,000 emails/mo |
| Pro | ~€18/mo for 50k |

**Bootstrap:** €0  
**Early:** €0–18

### Domains & SSL

| Item | Cost |
|------|------|
| `auroranexis.com` | ~€12/year → ~€1/mo |
| Subdomains | €0 (DNS only) |
| SSL | €0 (Vercel) |

### Monitoring & backups

- Supabase Pro: daily backups included
- External uptime: free tier (e.g. Better Stack free) or `/api/health` cron — €0 bootstrap

### AI costs (OpenAI)

| Usage | Tokens/mo | Est. cost |
|-------|-----------|-----------|
| Bootstrap (dev + 3 pilots) | ~500k | €5–10 |
| Early (10 customers, light AI) | ~2M | €15–30 |
| Growth (50 customers) | ~10M | €60–120 |

Assumes plan-gated AI features and `gpt-4o-mini` pricing.

### OAuth providers

All listed connectors: **€0** (developer tiers).

---

## Scenario totals

### BOOTSTRAP — 1 founder, 0 customers, 3 pilots

| Category | Low (€) | High (€) |
|----------|---------|----------|
| Vercel | 0 | 20 |
| Supabase | 0 | 0 |
| Storage/bandwidth | 0 | 5 |
| Stripe fees | 0 | 0 |
| Sentry | 0 | 0 |
| PostHog | 0 | 0 |
| Email | 0 | 0 |
| Domains/SSL | 1 | 1 |
| Monitoring/backups | 0 | 0 |
| AI | 5 | 15 |
| OAuth | 0 | 0 |
| **Total** | **~6** | **~41** |

✅ Well under €50–100 target.

### EARLY STAGE — 10 customers

| Category | Low (€) | High (€) |
|----------|---------|----------|
| Vercel Pro | 20 | 20 |
| Supabase Pro | 23 | 23 |
| Storage/bandwidth | 5 | 15 |
| Stripe (on €2,490 GMV) | ~75 | ~75 |
| Sentry | 0 | 26 |
| PostHog | 0 | 10 |
| Email | 0 | 18 |
| Domains/SSL | 1 | 1 |
| AI | 15 | 30 |
| **Infra subtotal (excl. Stripe)** | **~64** | **~143** |
| **Total incl. Stripe fees** | **~139** | **~218** |

Note: Stripe fees are cost of revenue, not fixed infra.

### GROWTH — 50 customers

| Category | Low (€) | High (€) |
|----------|---------|----------|
| Vercel Pro + overage | 20 | 50 |
| Supabase Pro + add-ons | 23 | 75 |
| Storage/bandwidth | 15 | 40 |
| Stripe (on ~€12k GMV) | ~350 | ~350 |
| Sentry + PostHog | 26 | 76 |
| Email | 18 | 18 |
| AI | 60 | 120 |
| **Infra subtotal (excl. Stripe)** | **~162** | **~379** |
| **Total incl. Stripe fees** | **~512** | **~729** |

---

## Future spend trajectory

| Phase | Timeline | Monthly infra (excl. Stripe) |
|-------|----------|------------------------------|
| Bootstrap | Months 0–6 | €15–50 |
| First revenue | Month 3+ | €50–80 |
| Early stage | 10 customers | €80–150 |
| Growth | 50 customers | €200–400 |

---

## Break-even estimate

See [pricing-assumptions.md](./pricing-assumptions.md).

- **Infra break-even:** 1 Professional customer (€249/mo) covers bootstrap + early infra
- **Founder salary break-even:** Out of scope for infra doc; see [runway-analysis.md](./runway-analysis.md)

---

## Related

- [platform-costs.md](./platform-costs.md)
- [pilot-budget.md](./pilot-budget.md)
- [runway-analysis.md](./runway-analysis.md)
