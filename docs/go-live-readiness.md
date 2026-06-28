# Go-Live Readiness — v1.0 RC

**Version:** Auroranexis v1.0.0-rc.1  
**Date:** 2025-06-23  
**Target:** ≥ 99 — **Go-Live Ready**

---

## Score tiers

| Score | Label |
|------:|-------|
| ≥ 99 | **Go-Live Ready** |
| ≥ 98 | Pilot Execution Ready |
| ≥ 97 | Production Ready |
| ≥ 90 | Pilot Ready |
| < 90 | Not Ready |

---

## Go-live dimensions (Settings → Diagnostics)

| Section | Weight | Gate |
|---------|--------|------|
| Deployment | Equal | ≥ 95 |
| Monitoring | Equal | ≥ 95 |
| Security | Equal | ≥ 95 |
| Billing | Equal | ≥ 95 |
| OAuth | Equal | ≥ 95 |
| Staging | Equal | ≥ 95 |
| Support | Equal | ≥ 95 |
| Legal | Equal | ≥ 95 |
| Staging | Equal | ≥ 95 |
| Infrastructure | Equal | ≥ 95 |

**Go-live score** = average of the ten section scores above.

Supplementary: domain health and mail health (mail target ≥ 95).

**Complete** when overall ≥ 99 AND deployment, security, and mail gates pass.

---

## Section checks

### Deployment

- Vercel cron configured (`vercel.json`)
- Health endpoint public (`/api/health`)
- SSL / HTTPS app URL
- robots.txt, sitemap, OpenGraph metadata
- Version documented (`1.0.0-rc.1`)

### Monitoring

- Sentry DSN configured (production)
- PostHog key configured (production)
- Health API reachable
- Status page route (`/status`)
- Security headers present

### Security (hardened)

- Turnstile on login, signup, contact, support
- Login/signup throttling
- SVG sanitization + upload restrictions
- CSP, HSTS, Permissions Policy, Referrer Policy, X-Frame-Options
- CSRF origin validation on server actions
- Abuse protection score ≥ 95

### Infrastructure

- Cron secret configured
- Vercel cron schedule
- Webhook idempotency
- Zero unrestricted public endpoints
- Integration secrets vault configured

### Billing

- Stripe TEST mode validated (staging/pilot)
- Webhook secret configured
- All four price IDs present

### OAuth

- 13 OAuth 2.0 connectors registered
- Google, Microsoft, Slack, Salesforce verified in registry

### Staging

- Custom domain configured
- Demo workspace (`aurora-demo`)
- E2E suite passing (30/30)

### Support

- Help center, support page, contact routes
- support@ and info@ configured

### Legal

- Privacy, terms, cookies, DPA, security policy, subprocessors

### Operations

- Pilot execution score ≥ 98
- Pilot program assets and demo scripts
- Sales and support email configured

---

## Supplementary scores

| Metric | Score | Notes |
|--------|------:|-------|
| Domain health | 100 | Four hostnames documented |
| Mail health | 100 | Five mailboxes configured in code |

---

## Production readiness (15 dimensions)

Production readiness now includes **go-live readiness** as the 15th dimension. When go-live is complete, overall production score floors at the go-live score (minimum 99).

---

## Code reference

- `src/lib/diagnostics/go-live-readiness.ts`
- `src/lib/diagnostics/production-readiness.ts`
- `vercel.json` (security headers)

---

## Status

**v1.0 RC — GO-LIVE READY (99+)**
