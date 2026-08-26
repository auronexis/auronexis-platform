# Production Operator Technical Closeout

**Date:** 2026-08-26  
**Repository:** Auroranexis (`main` @ `7cc70d0`)  
**Mode:** READ-ONLY forensic / operator verification — no migrations, deploy, push, or LIVE charging  
**Verdict:** **OPERATOR_CONFIRMATION_REQUIRED**

Engineering money-path controls are proven (Mollie 323/323, Enterprise 399/399, Final LIVE gate 28/28). Production operator-owned gates remain open: migration apply confirmation, production env/webhook sign-off, PITR/backup owner, and enterprise checklist sections A–F.

**Do not enable `MOLLIE_LIVE_CHARGING_ENABLED` until P1-002 counsel sign-off + operator confirmations below are recorded.**

---

## 1. Repository state (2026-08-26)

| Check | Result |
|-------|--------|
| Branch | `main` |
| HEAD | `7cc70d0` — `docs: close production operator technical readiness` |
| Prior LIVE gate commit | `d9ad461` — `docs: add final LIVE billing activation gate (BLOCKED)` |
| Origin | `https://github.com/auronexis/auronexis-platform.git` |
| Ahead/behind | **Ahead of `origin/main` by 1 commit** (not pushed) |
| Working tree | Clean |
| Final LIVE gate doc | `docs/final-live-billing-activation-gate.md` (LIVE_ACTIVATION_BLOCKED) |

---

## 2. Required migration manifest (code-traced)

**Do NOT apply from this document.** Classifications reflect repository evidence only — no production DB access from engineering.

| Order | Migration | Required by current code | Code dependency | Additive | Operator status | LIVE impact |
|------:|-----------|--------------------------|-----------------|----------|-----------------|-------------|
| 1 | `20250820000000_mollie_test_subscription_lifecycle.sql` | **Yes** | `mollie_webhook_events` ledger (`webhooks.ts`); `billing_provider` CHECK includes `mollie`; `mollie_test_subscriptions` TEST surface | Yes | **NOT_CONFIRMED** | **BLOCKING** for webhook idempotency |
| 2 | `20250822010000_mollie_pending_plan_change.sql` | **Yes** | `pending_plan`, `pending_plan_effective_at`, `pending_plan_change_type` on `organization_subscriptions` (`lifecycle.ts`, `organization-sync.ts`, `plan-change.ts`) | Yes | **NOT_CONFIRMED** | **BLOCKING** for upgrade/downgrade schedule |
| 3 | `20250822020000_mollie_upgrade_payment_attempt.sql` | **Yes** | `upgrade_payment_id`, `upgrade_target_plan` (`upgrade-payment.ts`, `organization-sync.ts`) | Yes | **NOT_CONFIRMED** | **BLOCKING** for prorated upgrade |
| 4 | `20250824100000_p1_002_pricing_tax_invoice_contracting.sql` | **Yes** | `organization_billing_identities`, `organization_contract_acceptances`, `sales_invoices`, `allocate_sales_invoice_number` RPC (`billing-identity.ts`, `sales-invoice.ts`) | Yes | **NOT_CONFIRMED** | **BLOCKING** for B2B checkout + invoice issue |
| 5 | `20250826100000_sales_invoice_tax_evidence_snapshots.sql` | **Yes** | `seller_snapshot`, `tax_decision_evidence`, `reverse_charge_applied`, `business_classification` on `sales_invoices` (`sales-invoice.ts` insert/read) | Yes | **NOT_CONFIRMED** | **BLOCKING** for immutable tax evidence |

**Related (prior closeout — re-verify, not Mollie-core):**

| Migration | Prior operator claim | Re-verify |
|-----------|---------------------|-----------|
| `20250824140000_public_api_service_role_grants.sql` | Applied (final-production-closeout) | Confirm in `schema_migrations` |
| `20250824115000` / `20250824120000` white-label | Applied (`production_ok=true`) | Confirm RLS + DELETE policy |

**NOT_REQUIRED for Mollie billing path:** Historical Stripe/Paddle/FastSpring migrations (archive columns retained; no active runtime).

---

## 3. Operator SQL verification package (READ-ONLY — no PII)

Run in **Supabase Dashboard → SQL Editor** on production (after staging pass). No writes. No `SELECT *` on tenant tables.

### 3.1 Migration history

```sql
SELECT version, name
FROM supabase_migrations.schema_migrations
WHERE version IN (
  '20250820000000',
  '20250822010000',
  '20250822020000',
  '20250824100000',
  '20250826100000',
  '20250824140000'
)
ORDER BY version;
```

**PASS:** 6 rows (or 5 if grants already confirmed separately). **FAIL:** Any required version missing.

### 3.2 Mollie webhook idempotency ledger

```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'mollie_webhook_events'
) AS mollie_webhook_events_exists;

SELECT COUNT(*) AS constraint_count
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'mollie_webhook_events'
  AND c.contype = 'u'
  AND pg_get_constraintdef(c.oid) ILIKE '%provider%provider_event_id%';
```

**PASS:** Table exists; unique constraint on `(provider, provider_event_id)`.

### 3.3 Subscription plan-change columns

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organization_subscriptions'
  AND column_name IN (
    'pending_plan', 'pending_plan_effective_at', 'pending_plan_change_type',
    'provider_change_reference', 'upgrade_payment_id', 'upgrade_target_plan',
    'billing_currency', 'catalog_price_version', 'catalog_amount_minor'
  )
ORDER BY column_name;
```

**PASS:** 9 rows.

### 3.4 P1-002 billing / invoice schema

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'organization_billing_identities',
    'organization_contract_acceptances',
    'sales_invoices',
    'sales_invoice_number_counters'
  )
ORDER BY table_name;

SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'allocate_sales_invoice_number';
```

**PASS:** 4 tables; 1 function `(uuid, integer)`.

### 3.5 Tax evidence snapshot columns (20250826100000)

```sql
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'sales_invoices'
  AND column_name IN (
    'seller_snapshot', 'tax_decision_evidence',
    'reverse_charge_applied', 'business_classification'
  )
ORDER BY column_name;
```

**PASS:** 4 rows; `reverse_charge_applied` NOT NULL DEFAULT `false`.

### 3.6 Billing provider CHECK includes mollie

```sql
SELECT pg_get_constraintdef(c.oid) AS check_def
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'organization_subscriptions'
  AND c.contype = 'c'
  AND pg_get_constraintdef(c.oid) ILIKE '%billing_provider%';
```

**PASS:** CHECK includes `'mollie'`.

---

## 4. Production environment manifest (variable names only)

From `src/lib/billing/providers/mollie/*`, `src/lib/env/production-audit.ts`, `src/lib/billing/vies.ts`, `.env.example`.

| Variable | Role | Controlled production expectation |
|----------|------|----------------------------------|
| `MOLLIE_API_KEY` | Mollie API (server-only) | Prefer `test_` prefix |
| `MOLLIE_BILLING_ROLLOUT` | Master checkout switch | `true` |
| `MOLLIE_LIVE_CHARGING_ENABLED` | LIVE write kill switch | **`false`** (required) |
| `MOLLIE_BILLING_ORG_ALLOWLIST` | Emergency partial enable | Optional comma-separated org UUIDs |
| `MOLLIE_BILLING_DEFAULT_FOR_NEW` | Diagnostics only | Optional |
| `NEXT_PUBLIC_APP_URL` | Webhook/return URL base | HTTPS production host (`https://app.auroranexis.com` or www per deploy) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project | Set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client RLS | Set |
| `SUPABASE_SERVICE_ROLE_KEY` | Server writes / webhook | Set (server-only) |
| `CRON_SECRET` | Cron + operator recovery auth | Set in production |
| `VIES_VALIDATION_MODE` | VAT validation bypass | **Unset** in production (never `skip`) |
| `VIES_CHECK_VAT_URL` | Optional VIES endpoint override | Optional |
| `INTEGRATION_SECRET_KEY` | Vault writes | Set (prior closeout verified) |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Error reporting | Set |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | Analytics | Set (consent-gated) |

**Must remain unset in production:** `TURNSTILE_DISABLE`, `E2E_DISABLE_RATE_LIMIT`, `DEV_FORCE_PLAN`.

**Operator confirmation in repo:** **NO** — Vercel Production diff not recorded here.

---

## 5. Legacy provider env (active requirement = 0)

| Provider | Active `process.env` requirement in `src/` | Active API routes |
|----------|---------------------------------------------|-------------------|
| Stripe | **0** | **0** |
| Paddle | **0** | **0** |
| FastSpring | **0** (410 tombstones only) | `/api/fastspring/webhook`, `/api/fastspring/connectivity` → 410 |
| Mollie | Sole active (`getActiveBillingProvider()` → `"mollie"`) | `/api/mollie/webhook`, `/api/mollie/connectivity` |

`.env.example` contains no active `STRIPE_` / `PADDLE_` / `FASTSPRING_` keys (verified by `test:legacy-billing-removal`).

---

## 6. Mollie webhook closeout (code-proven)

| Item | Evidence | Operator action |
|------|----------|-----------------|
| Route | `POST /api/mollie/webhook` — `src/app/api/mollie/webhook/route.ts` | Register classic webhook in Mollie dashboard |
| Expected URL | `{NEXT_PUBLIC_APP_URL}/api/mollie/webhook` via `buildMollieWebhookUrl()` | Confirm matches production `NEXT_PUBLIC_APP_URL` |
| Playbook canonical | `https://www.auroranexis.com/api/mollie/webhook` | Use www **or** app host consistently with env |
| Dashboard type | Classic payment notification (form body `id=tr_…`) — **not** Next-Gen / `X-Mollie-Signature` | Do not register Next-Gen webhooks |
| Per-payment `webhookUrl` | Set on every Mollie payment create (`production-checkout.ts`, `checkout.ts`, `upgrade-payment.ts`, `cancellation-withdrawal.ts`) | Per-payment URL overrides dashboard default |
| Idempotency | `ensureMollieIdempotency` → `mollie_webhook_events` unique `(provider, provider_event_id)` | Confirm table exists (SQL §3.2) |
| Authoritative fetch | `client.payments.get(paymentId)` in `webhooks.ts` (lines 582, 776, 1084) | N/A — code enforced |
| LIVE kill switch | LIVE credential + `MOLLIE_LIVE_CHARGING_ENABLED=false` → webhook **503** | Keep flag **false** |

**Operator dashboard sign-off:** **INCOMPLETE**.

---

## 7. Production URL / origin consistency

| Surface | Canonical | Code behaviour |
|---------|-----------|----------------|
| Marketing | `www.auroranexis.com` | `src/lib/deployment/production-domains.ts` |
| App / dashboard | `app.auroranexis.com` | Same |
| Billing webhook | Derived from `NEXT_PUBLIC_APP_URL` | `getAppUrl()` throws in production if unset; no localhost fallback in prod |
| Localhost | Dev fallback only | `getAppUrl()` → `http://localhost:3000` when `NODE_ENV !== production` |

**Operator must ensure:** Production `NEXT_PUBLIC_APP_URL` is HTTPS production host; Mollie dashboard webhook matches that host + `/api/mollie/webhook`.

---

## 8. PITR / backup (cannot verify from code)

**Engineering cannot claim PITR enabled.** Operator must confirm in Supabase Dashboard:

1. **Project → Settings → Database → Backups** — automated backups enabled.
2. **Point-in-Time Recovery** — enabled (plan-dependent); record retention window.
3. Assign backup owner and restore drill date per `docs/disaster-recovery.md`.

**Status:** **INCOMPLETE** (no dashboard evidence in repository).

---

## 9. Production diagnostics (code-verifiable today)

| Probe | Endpoint / surface | What it proves |
|-------|-------------------|----------------|
| Ready | `GET /api/ready` | App + DB reachable |
| Health | `GET /api/health` | Includes `configuration.mollie` when configured |
| Mollie connectivity | `GET /api/mollie/connectivity` (Bearer `CRON_SECRET` or owner/admin session) | Read-only Mollie API probe — no charge |
| Env audit | `auditProductionEnvironment()` | Required env names configured (names only) |
| Billing diagnostics | Settings → Billing → Diagnostics | Mollie config health via `checkMollieApiConfigHealth` |
| Platform status | `/api/status`, `/status` | Public degraded/maintenance snapshot |

---

## 10. Go-live playbook / checklist sections A–F

From `docs/enterprise-release-checklist.md` — all rows **INCOMPLETE** until operator signs with owner + timestamp.

| Section | Topic | Engineering pre-flight | Operator status |
|---------|-------|------------------------|-----------------|
| **A** | Environment validation | Docs + contracts complete; prior keys verified (Sentry/PostHog/INTEGRATION) | **INCOMPLETE** — Production env diff ritual |
| **B** | Migration validation | 5 billing migrations present in repo; ordered | **INCOMPLETE** — prod apply + PITR not confirmed |
| **C** | Pipeline validation | lint/typecheck/build/regression **PASS** (2026-08-26) | **INCOMPLETE** — operator sign-off on release commit |
| **D** | Billing (Mollie) | Webhook route + idempotency + fail-closed LIVE gate proven in code | **INCOMPLETE** — dashboard webhook + staging smoke |
| **E** | Portal validation | Code complete | **INCOMPLETE** — operator smoke |
| **F** | Authentication validation | Code complete | **INCOMPLETE** — operator smoke |

**Explicitly OUT OF SCOPE (do not mark complete here):** P1-002 external tax/legal/MoR; credit notes (`SALES_INVOICE_CREDIT_NOTE_STATUS.supported === false`).

---

## 11. Operator checklist (max 5 areas)

| # | WHERE | WHAT | EXPECTED | PASS / FAIL |
|---|-------|------|----------|-------------|
| 1 | Supabase SQL Editor | Run §3.1–§3.6 verification queries | All required migrations + schema objects present | ☐ PASS ☐ FAIL |
| 2 | Vercel Production → Environment | Diff vs `.env.example` | `MOLLIE_LIVE_CHARGING_ENABLED=false`; `MOLLIE_BILLING_ROLLOUT=true`; no legacy provider keys | ☐ PASS ☐ FAIL |
| 3 | Mollie Dashboard → Webhooks | Classic payment webhook registered | URL = `{NEXT_PUBLIC_APP_URL}/api/mollie/webhook`; not Next-Gen | ☐ PASS ☐ FAIL |
| 4 | Supabase Dashboard → Database → Backups | PITR / automated backup | Enabled; owner + retention recorded | ☐ PASS ☐ FAIL |
| 5 | Production HTTPS | `GET /api/ready`, `GET /api/mollie/connectivity` (auth) | 200; Mollie probe sanitized JSON | ☐ PASS ☐ FAIL |

---

## 12. Validation (2026-08-26 — engineering)

| Suite | Result |
|-------|--------|
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** (pre-existing warnings; exit 0) |
| `npm run build` | **PASS** |
| `npm run test:mollie-billing` | **PASS** (323/323) |
| `npm run test:enterprise-regression` | **PASS** (399/399) |
| `npm run test:legacy-billing-removal` | **PASS** (16/16) |
| `npm run test:production-readiness` | **PASS** (17/17) |
| `npm run test:final-production-closeout` | **PASS** (30/30) |
| `npm run test:final-live-billing-gate` | **PASS** (28/28) |

---

## 13. Final classification

**PRODUCTION_OPERATOR_TECHNICAL_CLOSEOUT = OPERATOR_CONFIRMATION_REQUIRED**

- Engineering: **READY** for SAFE CONTROLLED PRODUCTION MODE (Mollie TEST / LIVE charging off).
- Operator: **NOT CLOSED** — migrations, env diff, webhook dashboard, PITR, checklist A–F.
- **NOT BLOCKED** at engineering layer (no new critical defect proven).
- **NOT CLOSED** — operator confirmations pending.

**HARD STOP:** No push, deploy, migrations apply, Vercel/Supabase/Mollie mutation, or `MOLLIE_LIVE_CHARGING_ENABLED=true` from this closeout.
