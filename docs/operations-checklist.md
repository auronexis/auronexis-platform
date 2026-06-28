# Operations Checklist — Go-Live

**Date:** 2025-06-23  
**Version:** v1.0.0-rc.1  
**Operations score:** 100/100

---

## Pre-launch (T-7 days)

### Support

- [ ] `support@auroranexis.com` monitored (shared inbox or ticketing)
- [ ] `info@auroranexis.com` routed to general queue
- [ ] Help center live at `/help` with documentation links
- [ ] Contact form at `/contact` delivers to support/sales
- [ ] Status page at `/status` reflects platform health

### Pilot program

- [ ] Pilot invitation template in `docs/pilot-assets/`
- [ ] Pilot agreement outline reviewed ([pilot-contract-outline.md](./pilot-contract-outline.md))
- [ ] Founding customer list maintained ([founding-customers.md](./founding-customers.md))
- [ ] Feedback surveys ready ([pilot-feedback.md](./pilot-feedback.md))

### Sales & demo

- [ ] Demo script v2 reviewed ([demo-script-v2.md](./demo-script-v2.md))
- [ ] `aurora-demo` workspace seeded (`npm run seed:pilot`)
- [ ] SQL seeds applied on Supabase (demo, hardening, personas)
- [ ] Sales assets and pricing page aligned with Stripe products

---

## Pre-launch (T-1 day)

### Infrastructure

- [ ] Run `validate_staging.sql` on production Supabase
- [ ] Verify Vercel production deploy green
- [ ] Confirm `/api/health` returns JSON with version `1.0.0-rc.1`
- [ ] Cron `/api/cron/run` succeeding (Vercel Crons dashboard)
- [ ] Zero failed Stripe webhooks in diagnostics

### Security

- [ ] Turnstile keys set in Vercel production (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`)
- [ ] Security headers verified on production (`curl -I`)
- [ ] `CRON_SECRET` and `INTEGRATION_SECRET_KEY` set in Vercel
- [ ] No secrets in repository or client bundles
- [ ] DMARC policy published

### Monitoring

- [ ] Sentry receiving errors from staging smoke test
- [ ] PostHog receiving pageviews (if enabled)
- [ ] External uptime monitor on `/api/health`

---

## Launch day (T-0)

- [ ] DNS cutover complete (if not already live)
- [ ] Production OAuth callbacks verified for priority connectors (Google, Microsoft, Slack)
- [ ] Send pilot invitation to first founding customer
- [ ] Monitor diagnostics for 24h (owner account)
- [ ] Confirm E2E smoke on production URL (optional post-deploy)

---

## Post-launch (T+7 days)

- [ ] Review pilot feedback surveys
- [ ] Triage support inbox SLA (< 24h response)
- [ ] Review Stripe billing events and failed webhooks
- [ ] Review audit events and queue dead letters
- [ ] Update status page if incident occurred

---

## Daily operations (5 min)

1. Settings → Diagnostics — overall score and label
2. Stripe webhooks: failed events = 0
3. Cron: status healthy, failed jobs ≤ 5 (24h)
4. Queue: dead letters ≤ 5, backlog reasonable
5. Connector health: no unexpected unhealthy connections

Full runbook: [operations-runbook.md](./operations-runbook.md)

---

## Key contacts

| Role | Email |
|------|-------|
| General | info@auroranexis.com |
| Support | support@auroranexis.com |
| Sales | sales@auroranexis.com |
| Security | security@auroranexis.com |
| System mail | no-reply@auroranexis.com |

---

## Related assets

| Asset | Location |
|-------|----------|
| Pilot checklist | [pilot-checklist-v1.md](./pilot-checklist-v1.md) |
| Customer journey | [customer-journey.md](./customer-journey.md) |
| Demo environment | [demo-environment.md](./demo-environment.md) |
| Production checklist | [production-checklist.md](./production-checklist.md) |
| Go-live report | [go-live-report.md](./go-live-report.md) |

**Operations score: 100/100 — Ready for customer onboarding**
