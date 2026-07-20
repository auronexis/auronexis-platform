> **ARCHIVED (Build Bible V2 Chapter 14).** Use [enterprise-deployment.md](./enterprise-deployment.md), [enterprise-release-checklist.md](./enterprise-release-checklist.md), and [rollback-plan.md](./rollback-plan.md). Historical Stripe-era notes below are not authoritative.
# Production Deployment â€” v1.0.3

**Version:** 1.0.3  
**Status:** Launch Candidate

## Domains

| Host | Role |
|------|------|
| `auroranexis.com` | Marketing apex |
| `www.auroranexis.com` | 301 â†’ apex |
| `app.auroranexis.com` | Production SaaS |
| `staging.auroranexis.com` | Staging / QA |

Configuration: `src/lib/deployment/production-domains.ts`  
Redirects: `next.config.ts` + Vercel domain settings

## Validation checklist

- [ ] SSL certificates active on all hosts
- [ ] `www` redirects to apex (301)
- [ ] `/robots.txt` disallows dashboard routes
- [ ] `/sitemap.xml` includes marketing + legal routes
- [ ] OpenGraph metadata via `src/lib/branding/metadata.ts`
- [ ] Cache headers via `vercel.json` and `src/lib/deployment/cache-headers.ts`
- [ ] `/api/health` returns 200 with `Cache-Control: no-store`

## Diagnostics

Settings â†’ Diagnostics â†’ **Deployment readiness** and **Launch candidate readiness**

