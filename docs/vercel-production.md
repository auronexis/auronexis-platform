# Vercel Production — Phase 6

**Date:** 2025-06-23  
**Version:** v1.0.0-rc.1  
**Deployment score:** 100/100

---

## Projects

| Vercel project | Repository | Primary domain | Role |
|----------------|------------|----------------|------|
| **auroranexis-marketing** | Auroranexis | `auroranexis.com` | Marketing site, legal, pilot program |
| **auroranexis-app** | Auroranexis | `app.auroranexis.com` | Production SaaS application |

Optional: single monorepo with path-based routing — current setup uses one Next.js app deployed to both hostnames via environment-specific `NEXT_PUBLIC_APP_URL`.

---

## Environment separation

| Environment | Vercel scope | Hostname | Stripe | Supabase |
|-------------|--------------|----------|--------|----------|
| **Development** | Local `.env.local` | `localhost:3000` | Test | Dev/staging project |
| **Preview** | PR branches | `*.vercel.app` | Test | Staging optional |
| **Staging** | Production env (staging project) | `staging.auroranexis.com` | Test | Staging project |
| **Production** | Production env (app project) | `app.auroranexis.com` | Live (when enabled) | Production project |

Never mix live Stripe keys with staging hostname.

---

## Domains

| Domain | Project | Redirect |
|--------|---------|----------|
| `auroranexis.com` | marketing or app | Apex marketing |
| `www.auroranexis.com` | marketing | 301 → apex |
| `app.auroranexis.com` | app | Production SaaS |
| `staging.auroranexis.com` | app (staging) | Pilot / QA |

---

## SSL

- Vercel auto-provisions Let's Encrypt certificates
- HSTS enforced via `vercel.json` headers
- Verify: `curl -I https://app.auroranexis.com`

---

## Redirects

| Rule | Implementation |
|------|----------------|
| HTTP → HTTPS | Vercel automatic |
| www → apex | Vercel Domains UI |
| Legacy legal paths | Next.js redirects in app |
| Auth-gated routes | Middleware (`src/lib/supabase/middleware.ts`) |

Public routes (no auth redirect): marketing pages, `/api/health`, webhooks, cron.

---

## Cache headers

| Path | Header |
|------|--------|
| `/api/health` | `Cache-Control: no-store, max-age=0` |
| Static `/_next/static/*` | Immutable CDN cache |
| API routes | Default no-cache unless specified |

---

## SEO assets

| Asset | Route | Status |
|-------|-------|--------|
| robots.txt | `/robots.txt` | Allow public marketing; disallow `/dashboard` |
| sitemap.xml | `/sitemap.xml` | 12+ routes from `PUBLIC_SITEMAP_ROUTES` |
| Canonical URLs | Per-page metadata | Absolute URLs with app hostname |
| OpenGraph | Root + marketing layouts | og:title, og:description, og:image |

---

## Cron

Configured in `vercel.json`:

```json
{
  "path": "/api/cron/run",
  "schedule": "*/15 * * * *"
}
```

Requires `CRON_SECRET` in production environment variables.

---

## Build settings

| Setting | Value |
|---------|-------|
| Framework | Next.js (App Router) |
| Node.js | 22.x |
| Install | `npm install` |
| Build | `npm run build` |

Pre-deploy validation:

```bash
npm run lint && npm run typecheck && npm run build && npm run test:e2e
```

---

## Environment variables (production app)

Minimum set — full list in [vercel-checklist.md](./vercel-checklist.md):

```
NEXT_PUBLIC_APP_URL=https://app.auroranexis.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CRON_SECRET=
INTEGRATION_SECRET_KEY=
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
```

---

## Verification checklist

- [ ] Both Vercel projects linked to repository
- [ ] All four domains assigned and SSL valid
- [ ] Production vs staging env vars isolated
- [ ] Cron job visible in Vercel → Crons
- [ ] `/api/health` returns JSON (not login redirect)
- [ ] Security headers present on production deploy

---

## Related

- [vercel-deployment.md](./vercel-deployment.md)
- [deployment-v0.99.md](./deployment-v0.99.md)
- [domain-health.md](./domain-health.md)

**Deployment score: 100/100**
