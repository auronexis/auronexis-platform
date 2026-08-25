# Rollback Plan

**Canonical** deterministic rollback for Auroranexis production releases.
**Related:** [enterprise-deployment.md](./enterprise-deployment.md) · [disaster-recovery.md](./disaster-recovery.md)

Never invent ad-hoc rollback steps during an incident — follow this order.

---

## Decision tree

| Symptom | First action |
|---------|--------------|
| App 5xx / bad build | Application rollback (§1) |
| Bad migration / data corruption | Stop traffic → DB restore guidance (§2) |
| Wrong env / secrets | Environment rollback (§3) |
| Experimental feature blast radius | Feature / kill-switch rollback (§4) |
| Billing webhook storms / bad handler | Webhook rollback (§5) |
| Deploy pipeline failed mid-promote | Deployment failure recovery (§6) |

---

## 1. Application rollback

1. Identify last known good Vercel deployment (previous Production promotion).
2. Instant Rollback / Redeploy previous artifact — **do not** push untested hotfixes as first response.
3. Confirm `GET /api/ready` → 200 and `GET /api/health` not `unavailable`.
4. Spot-check login + dashboard + billing settings page.
5. Announce status; keep Mollie webhook endpoint online unless §5 applies.

**Deterministic exit:** Ready probe green + auth smoke pass.

---

## 2. Migration rollback guidance

Migrations are **forward-only**. There are no guaranteed down scripts.

1. Prefer application rollback if the bad release did not require irreversible schema.
2. If schema/data is corrupt:
   - Freeze writes if possible (maintenance mode / scale down cron).
   - Restore via Supabase PITR or daily backup to a known good timestamp (see [disaster-recovery.md](./disaster-recovery.md)).
   - Point production env at restored project **or** restore in-place per Supabase procedure.
   - Re-apply only migrations that are known-good after the restore point.
3. Never “hand edit” production schema to undo a release under pressure.

**Deterministic exit:** Tenant queries succeed; RLS still enabled; billing tables consistent.

---

## 3. Environment rollback

1. Diff Vercel Production env against last known good export / password manager snapshot.
2. Revert accidental localhost URLs, a `live_` Mollie key without LIVE approval, missing `CRON_SECRET`, or E2E bypass flags.
3. Keep `MOLLIE_LIVE_CHARGING_ENABLED=false` unless an approved LIVE cutover is in progress.
4. Redeploy or restart serverless so cold starts pick up secrets.
5. Re-run environment section of [enterprise-release-checklist.md](./enterprise-release-checklist.md).

**Deterministic exit:** `auditProductionEnvironment().readyForCustomers === true` on diagnostics.

---

## 4. Feature / kill-switch rollback

| Lever | Action |
|-------|--------|
| AI outage / cost spike | Set `AI_PROVIDER=disabled` and redeploy/restart |
| Plan confusion | Ensure `DEV_FORCE_PLAN` unset; entitlements resolve from Mollie subscriptions via `resolveOrganizationEntitlements` |
| NEW Mollie checkout blast | Set `MOLLIE_BILLING_ROLLOUT=false` (allowlist still works for partial enable) |
| LIVE charging | Ensure `MOLLIE_LIVE_CHARGING_ENABLED=false` |
| Abandoned `BILLING_PROVIDER` | Ignore — code path is Mollie-only |

**Deterministic exit:** Affected surface returns safe empty/degraded state without 500 loops.

---

## 5. Webhook rollback (Mollie)

1. In the Mollie dashboard, pause or disable the production classic webhook destination if the handler is poison.
2. Application-rollback the release that broke verification / processing.
3. Confirm idempotency store still accepts replays (`mollie_webhook_events`).
4. Re-enable webhook; rely on Mollie retries + `webhook_retries` job where applicable.
5. Rotate `MOLLIE_API_KEY` only if key leakage is suspected — update Vercel in the same window.
6. Do **not** re-enable Stripe/Paddle/FastSpring webhooks for active billing. `/api/fastspring/*` stays **410**.

**Deterministic exit:** Test payment notification reconciles; no duplicate entitlement grants.

---

## 6. Deployment failure recovery

1. Leave Production on previous healthy deployment.
2. Do not manually patch Production filesystem.
3. Fix on branch → re-run full pipeline (`lint` / `typecheck` / readiness / regression / `build`).
4. Re-attempt promote only after checklist sign-off.

**Deterministic exit:** CI green + staging smoke + checklist owners signed.

---

## Communication

- Record incident start, rollback start, and restore-complete timestamps.
- Link deployment URL / git SHA / migration version in the incident note.
