# Monitoring Report — Phase 5 Sprint 2

**Date:** 2025-06-23  
**Version:** Auroranexis v0.97

---

## Summary

Monitoring stack integrated for staging rollout: Sentry error tracking, PostHog product analytics, public health endpoint, diagnostics surfaces, and dashboard platform status widget.

---

## Integrations

### Sentry

| Item | Detail |
|------|--------|
| Package | `@sentry/nextjs` |
| Config | `sentry.client.config.ts`, `sentry.server.config.ts` |
| Registration | `src/instrumentation.ts` |
| Env | `SENTRY_DSN` (server), optional `NEXT_PUBLIC_SENTRY_DSN` (client) |
| Behavior | No-op when DSN unset |

**Setup:**

1. Create Sentry project (Next.js)
2. Add DSN to Vercel staging Production env
3. Deploy → trigger test error → confirm event

### PostHog

| Item | Detail |
|------|--------|
| Package | `posthog-js` |
| Provider | `src/components/observability/posthog-provider.tsx` |
| Env | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` |
| Behavior | No init when key unset |

**Events (automatic):** `$pageview`, `$pageleave`

**Recommended custom events (future):** signup, checkout_complete, connector_connected

### Health endpoint

| Route | `GET /api/health` |
|-------|-------------------|
| Checks | Database, Stripe webhooks table, cron, queue |
| Auth | Public (no secrets exposed) |
| Use | Uptime monitors, load balancers, pre-deploy smoke |

---

## In-app diagnostics

Settings → Diagnostics (owner/admin):

| Section | Covers |
|---------|--------|
| Stripe staging readiness | Checkout, portal, webhook, invoice, billing |
| Stripe webhooks | Idempotency table |
| Cron | Job registry, schedules, failures |
| Queue | Pending, dead letters, processing time |
| Connectors | OAuth config, token health, sync |
| OAuth | Provider-level configuration |
| Production readiness | Composite score |

---

## Dashboard platform status widget

Visible to **owner/admin** on Dashboard → **Platform status**:

- Database connectivity
- Stripe env + webhook table
- Cron (`CRON_SECRET` + job count)
- Queue (pending + dead letter)
- Sentry / PostHog configured flags
- Link to full diagnostics

---

## External monitoring (recommended)

| Layer | Tool | Target |
|-------|------|--------|
| Uptime | Better Stack / UptimeRobot | `/api/health` every 5 min |
| Errors | Sentry alerts | Error rate spike |
| Stripe | Stripe Dashboard | Webhook delivery failures |
| Supabase | Supabase status RSS | Region outages |

---

## Rollout phases

| Phase | Actions |
|-------|---------|
| **Staging (now)** | Health uptime check, Sentry DSN, PostHog key |
| **Pilot** | Sentry alert rules, weekly diagnostics review |
| **Pre-GA** | Status page, on-call rotation |

---

## Related

- [observability.md](./observability.md)
- [operations-runbook.md](./operations-runbook.md)
- [diagnostics-report.md](./diagnostics-report.md)
