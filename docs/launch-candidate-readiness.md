# Launch Candidate Readiness — v1.0.3

**Target score:** ≥ 99  
**Label:** Launch Candidate

## Dimensions

| Dimension | Weight | Checks |
|-----------|--------|--------|
| Launch readiness | 16.7% | Version, go-live, first customer, docs, Top 100, targets |
| Deployment | 16.7% | Domains, SSL, redirects, robots, sitemap, OpenGraph, cache |
| Sales execution | 16.7% | Top 100 segments, launch targets, pipeline |
| Onboarding | 16.7% | Proposal PDF, pilot agreement, kickoff, portal, health baseline |
| Security | 16.7% | CSP, HSTS, OAuth state, abuse protection |
| Revenue | 16.7% | Pipeline, booking, assets, version |

## In-app diagnostics

Settings → Diagnostics → **Launch candidate readiness**

## Pass criteria

```
score >= 99 → label "Launch Candidate"
```

## Implementation

`src/lib/diagnostics/launch-candidate-readiness.ts`

## Pre-launch checklist

- [ ] Connect `auroranexis.com`, `www`, `app`, and `staging` in Vercel
- [ ] Run Supabase migrations through `20250625200000_first_customer.sql`
- [ ] Configure Stripe, OAuth, and mail env in Vercel production
- [ ] Populate Top 100 agencies at `/sales/launch`
- [ ] Verify onboarding artifacts and customer portal
- [ ] Diagnostics shows **Launch Candidate**

## Status

**v1.0.3 — Launch Candidate** (when all checks pass)
