# Observability Recommendations

**Version:** Auroranexis v0.96  
**Scope:** Staging and production operational readiness

No new application features — integration guidance for pilot and GA.

---

## Stack overview

| Layer | Tool | Purpose |
|-------|------|---------|
| Errors | **Sentry** | Uncaught exceptions, API route failures, source maps |
| Product analytics | **PostHog** | Funnels, feature usage, session replay (opt-in) |
| Web analytics | Vercel Analytics or Plausible | Traffic, Core Web Vitals |
| Uptime | **Status page** (Better Stack, Instatus, or Statuspage) | Public incident communication |
| Logs | Vercel Logs + Supabase logs | Request tracing, DB errors |
| Synthetic | Cron + external ping | `/api/health` every 5 minutes |

---

## Health endpoint

Built-in probe: `GET /api/health`

Returns JSON with:

- Database connectivity
- Stripe webhook table readiness
- Cron registry status
- Queue worker metrics

Use for load balancers, uptime monitors, and pre-deploy smoke checks.

---

## Sentry integration

Installed: `@sentry/nextjs`

1. Create Sentry project (Next.js)
2. Set `SENTRY_DSN` in Vercel (server)
3. Optional: `NEXT_PUBLIC_SENTRY_DSN` for client errors
4. Config files: `sentry.client.config.ts`, `sentry.server.config.ts`, `src/instrumentation.ts`
5. No-op when DSN unset — safe for local dev

## PostHog integration

Installed: `posthog-js`

1. Create PostHog project
2. Set `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`
3. Provider: `src/components/observability/posthog-provider.tsx` (root layout)
4. No init when key unset

---

## Status page

Recommended before GA:

- Components: App (`app.auroranexis.com`), API, Auth, Billing (Stripe), Database
- Subscribe to Supabase status RSS
- Manual incident process in [operations-runbook.md](./operations-runbook.md)

---

## Error monitoring checklist

- [ ] Sentry DSN configured (or Vercel log alerts)
- [ ] Alert on 5xx rate > 1% over 5 minutes
- [ ] Stripe webhook delivery failures alerted (Stripe Dashboard email)
- [ ] Cron job failures visible in diagnostics + `job_runs` table

---

## Queue monitoring

- Diagnostics panel → Queue section
- Query `queue_jobs` for `dead_letter` status
- Alert if dead-letter count > 0 for 1 hour

---

## Cron monitoring

- Vercel Cron → `/api/cron/run` every 15 minutes
- Verify `job_runs` recent success in diagnostics
- Manual: `POST /api/cron/run` with `Authorization: Bearer $CRON_SECRET`

---

## Stripe monitoring

- Stripe Dashboard → Webhooks → event delivery log
- Diagnostics → Stripe staging readiness (staging)
- Idempotency table `stripe_webhook_events` — no duplicate processing errors

---

## Recommended rollout

| Phase | Actions |
|-------|---------|
| Pilot (now) | `/api/health` uptime check, Vercel log alerts, diagnostics weekly review |
| Pre-GA | Sentry + status page + PostHog core events |
| GA | On-call rotation, PagerDuty/Opsgenie integration |

---

## Related

- [operations-runbook.md](./operations-runbook.md)
- [deployment-staging.md](./deployment-staging.md)
- [diagnostics-report.md](./diagnostics-report.md)
