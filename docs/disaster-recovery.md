# Disaster Recovery

**Canonical** operational recovery for Auroranexis.
**RTO target:** 4 hours · **RPO target:** ≤ 24 hours (Supabase backup / PITR)
**Related:** [rollback-plan.md](./rollback-plan.md) · [enterprise-deployment.md](./enterprise-deployment.md) · [operations-runbook.md](./operations-runbook.md) · [billing.md](./billing.md)

---

## Summary

Recovery focuses on restoring database state, replaying background work, and re-establishing integrations (**Mollie webhooks**, cron, email, AI). Idempotency and queue layers tolerate replay when procedures below are followed.

Stripe, Paddle, and FastSpring paths are **historical archive only** — do not re-enable those webhooks for active billing. Active webhook path is `/api/mollie/webhook` only.

---

## Scope

| System | Data store | Recovery mechanism |
|--------|------------|-------------------|
| Mollie webhooks | `mollie_webhook_events` + subscription rows | Mollie dashboard retry + API re-fetch reconcile |
| Cron jobs | `job_*` / execution history | Reschedule + authorized force-run |
| Background queue | `queue_jobs`, `queue_dead_letters` | Re-enqueue from dead letters |
| Application | Vercel deployments | Instant rollback to last good |
| Email / AI / analytics | Provider accounts | Rotate keys; degrade gracefully |

---

## Recovery tiers

### Tier 1 — Partial degradation

Examples: Cron misconfigured, queue stalled, transient Mollie API errors, AI provider outage.

1. Follow [operations-runbook.md](./operations-runbook.md).
2. Use kill-switches (`AI_PROVIDER=disabled`, `MOLLIE_BILLING_ROLLOUT=false`, keep `MOLLIE_LIVE_CHARGING_ENABLED=false`) when needed.
3. Verify `/api/health` returns to healthy/degraded (not unavailable) within 1 hour.

### Tier 2 — Database restore required

1. Restore Supabase backup or PITR snapshot.
2. Update deployment env vars if project URL/keys change.
3. Re-apply only migrations newer than the restore point that are known-good.
4. Run post-restore validation (§ below).

### Tier 3 — Full platform loss

1. Provision deployment from known-good git tag.
2. Restore Supabase from backup.
3. Rotate secrets: `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `MOLLIE_API_KEY`, `INTEGRATION_SECRET_KEY`, email keys.
4. Re-register Mollie classic webhook with the production URL.
5. Reconfigure Vercel Cron Authorization.
6. Complete [enterprise-release-checklist.md](./enterprise-release-checklist.md) before traffic.

---

## Database backup strategy

| Control | Expectation |
|---------|-------------|
| Automated backups | Enabled on Supabase production project |
| PITR | Enabled where plan allows; document retention days |
| Restore drill | Practice on staging at least quarterly |
| Migration discipline | Forward-only; never rely on untested down SQL in production |

---

## Provider outage handling

| Provider | Degraded behaviour | Operator action |
|----------|--------------------|-----------------|
| Mollie | Checkout unavailable; entitlements unchanged until webhook sync | Status page; pause non-critical billing UI messaging |
| Supabase | App unavailable | Failover / restore; communicate outage |
| Email | Queue outbound; surface soft errors | Switch provider credentials if prolonged |
| OpenAI | AI features empty/disabled | `AI_PROVIDER=disabled` |
| Analytics | No client events | Optional — not customer-blocking |

---

## Expired secrets

1. Rotate compromised secret in provider dashboard.
2. Update Vercel Production env.
3. Redeploy/restart to pick up values.
4. For Mollie API key: update Vercel; confirm webhook still reconciles via API re-fetch.
5. Invalidate old cron bearer by setting new `CRON_SECRET` (old callers fail closed).

---

## Failed deployments

Follow [rollback-plan.md](./rollback-plan.md) §6 — leave Production on last good artifact.

---

## Webhook backlog recovery

1. Confirm handler healthy (classic payment id + API re-fetch + idempotency).
2. Retry from the Mollie dashboard for missed payment notifications.
3. Confirm no duplicate side effects (idempotency keys in `mollie_webhook_events`).
4. Monitor billing diagnostics panel.
5. Do not re-register retired `/api/fastspring/webhook` (410).

---

## Queue recovery

1. Inspect dead-letter / failed queue jobs in diagnostics.
2. Fix root cause (handler bug → app rollback first).
3. Re-enqueue dead letters deliberately (avoid blind mass replay).
4. Ensure cron fires every 5 minutes so `queue_worker` stays caught up.

---

## Post-restore validation

### Database

```sql
-- Job registry populated (expect 9 definitions after seed/sync)
SELECT COUNT(*) FROM job_definitions;

SELECT to_regclass('public.queue_jobs');
SELECT to_regclass('public.queue_dead_letters');

-- RLS still enabled on core tenant tables
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('organizations', 'clients', 'reports', 'subscriptions')
  AND relkind = 'r';
```

### Application

- `GET /api/ready` → 200
- `GET /api/health` → not `unavailable`; `configuration.mollie` when key set
- Login + one client list query
- Mollie TEST webhook / payment reconcile smoke (no LIVE charges)
- Cron authorized POST `/api/cron/run`

---

## Secret rotation checklist (Tier 3)

- [ ] Supabase service role
- [ ] Cron secret
- [ ] Mollie API key
- [ ] Integration vault key
- [ ] Email provider API key
- [ ] Turnstile secret
- [ ] OAuth connector secrets (if used)
