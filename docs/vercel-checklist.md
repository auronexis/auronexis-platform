# Vercel Deployment Checklist

**Version:** Auroranexis v0.96  
**Use for:** Staging and production Vercel projects

---

## Project setup

- [ ] Repository connected to Vercel
- [ ] Node.js version: **22.x** (Project Settings → General)
- [ ] Framework preset: **Next.js**
- [ ] Build command: `npm run build`
- [ ] Output: Next.js default (not static export)
- [ ] Install command: `npm install`

---

## Environment variables

Set per environment (Production / Preview / Development):

### All environments (staging + production)

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — **Encrypted, server only**
- [ ] `NEXT_PUBLIC_APP_URL` — match deployed domain
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_STARTER_PRICE_ID`
- [ ] `STRIPE_PROFESSIONAL_PRICE_ID`
- [ ] `STRIPE_BUSINESS_PRICE_ID`
- [ ] `STRIPE_ENTERPRISE_PRICE_ID`
- [ ] `RESEND_API_KEY`
- [ ] `RESEND_FROM_EMAIL`
- [ ] `INTEGRATION_SECRET_KEY`
- [ ] `CRON_SECRET`
- [ ] `AI_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL` (if AI enabled)

### Staging only

- [ ] Stripe keys are **test mode** (`sk_test_`, `pk_test_`)
- [ ] `NEXT_PUBLIC_APP_URL=https://staging.auroranexis.com`
- [ ] Optional: `DEV_FORCE_PLAN=enterprise` for demo (Preview only, never Production)

### Production only

- [ ] Stripe keys are **live mode** (`sk_live_`, `pk_live_`)
- [ ] `NEXT_PUBLIC_APP_URL=https://app.auroranexis.com`
- [ ] No `DEV_FORCE_PLAN`

---

## Domains

### Staging project

- [ ] `staging.auroranexis.com` added and verified
- [ ] SSL certificate active

### Production project

- [ ] `app.auroranexis.com` added and verified
- [ ] SSL certificate active

### Marketing (optional separate project)

- [ ] `auroranexis.com` + `www.auroranexis.com`

---

## Cron jobs

Add `vercel.json` at repository root (or staging-specific branch):

```json
{
  "crons": [
    {
      "path": "/api/cron/run",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

- [ ] `CRON_SECRET` set in Vercel
- [ ] Cron appears in Vercel → Settings → Cron Jobs after deploy
- [ ] Manual test: `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://staging.auroranexis.com/api/cron/run`

---

## Deploy verification

After each deploy:

```bash
npm run lint
npm run typecheck
npm run build
```

- [ ] Build succeeds on Vercel
- [ ] `GET /api/health` returns `{ "status": "healthy" }`
- [ ] Login page loads at `/login`
- [ ] Diagnostics page loads (owner account)
- [ ] Stripe webhook test event delivered (Stripe Dashboard → Webhooks → Send test)

---

## Security

- [ ] No secrets in git
- [ ] Service role key not prefixed with `NEXT_PUBLIC_`
- [ ] Vercel deployment protection enabled for Preview (optional)
- [ ] Staging access restricted (Vercel Authentication or IP allowlist) if required

---

## Related

- [deployment-staging.md](./deployment-staging.md)
- [domain-setup.md](./domain-setup.md)
- [production-checklist.md](./production-checklist.md)
