# Disaster Recovery

**Canonical** operational recovery for Auroranexis.  
**RTO target:** 4 hours · **RPO target:** ≤ 24 hours (Supabase backup / PITR)  
**Related:** [rollback-plan.md](./rollback-plan.md) · [enterprise-deployment.md](./enterprise-deployment.md) · [operations-runbook.md](./operations-runbook.md) · [paddle-billing.md](./paddle-billing.md)

---

## Summary

Recovery focuses on restoring database state, replaying background work, and re-establishing integrations (**Paddle webhooks**, cron, email, AI). Idempotency and queue layers tolerate replay when procedures below are followed.

Stripe paths are **historical archive only** — do not re-enable Stripe webhooks for active billing.

---

## Scope

| System | Data store | Recovery mechanism |
|--------|------------|-------------------|
| Paddle webhooks | Billing webhook idempotency + subscription rows | Paddle dashboard replay + signature verify |
| Cron jobs | `job_*` / execution history | Reschedule + authorized force-run |
| Background queue | `queue_jobs`, `queue_dead_letters` | Re-enqueue from dead letters |
| Application | Vercel deployments | Instant rollback to last good |
| Email / AI / analytics | Provider accounts | Rotate keys; degrade gracefully |

---

## Recovery tiers

### Tier 1 — Partial degradation

Examples: Cron misconfigured, queue stalled, transient Paddle API errors, AI provider outage.

1. Follow [operations-runbook.md](./operations-runbook.md).
2. Use kill-switches (`AI_PROVIDER=disabled`) when needed.
3. Verify `/api/health` returns to healthy/degraded (not unavailable) within 1 hour.

### Tier 2 — Database restore required

1. Restore Supabase backup or PITR snapshot.
2. Update deployment env vars if project URL/keys change.
3. Re-apply only migrations newer than the restore point that are known-good.
4. Run post-restore validation (§ below).

### Tier 3 — Full platform loss

1. Provision deployment from known-good git tag.
2. Restore Supabase from backup.
3. Rotate secrets: `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `INTEGRATION_SECRET_KEY`, email keys.
4. Re-register Paddle webhook with new signing secret.
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
| Paddle | Checkout/portal unavailable; entitlements unchanged until webhook sync | Status page; pause non-critical billing UI messaging |
| Supabase | App unavailable | Failover / restore; communicate outage |
| Email | Queue outbound; surface soft errors | Switch provider credentials if prolonged |
| OpenAI | AI features empty/disabled | `AI_PROVIDER=disabled` |
| Analytics | No client events | Optional — not customer-blocking |

---

## Expired secrets

1. Rotate compromised secret in provider dashboard.
2. Update Vercel Production env.
3. Redeploy/restart to pick up values.
4. For Paddle webhook secret: update Paddle notification secret in the same change window.
5. Invalidate old cron bearer by setting new `CRON_SECRET` (old callers fail closed).

---

## Failed deployments

Follow [rollback-plan.md](./rollback-plan.md) §6 — leave Production on last good artifact.

---

## Webhook backlog recovery

1. Confirm handler healthy (signature + idempotency).
2. Replay from Paddle dashboard for missed event IDs.
3. Confirm no duplicate side effects (idempotency keys).
4. Monitor billing diagnostics panel.

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
- `GET /api/health` → not `unavailable`
- Login + one client list query
- Paddle webhook test notification
- Cron authorized POST `/api/cron/run`

---

## Secret rotation checklist (Tier 3)

- [ ] Supabase service role
- [ ] Cron secret
- [ ] Paddle API key + webhook secret + client token (as needed)
- [ ] Integration vault key
- [ ] Email provider API key
- [ ] Turnstile secret
- [ ] OAuth connector secrets (if used)
