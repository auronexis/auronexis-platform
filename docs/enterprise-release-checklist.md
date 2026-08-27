# Enterprise Release Checklist

**Canonical** go-live checklist. Use before promoting staging → production.
Supersedes Stripe/Paddle/FastSpring-era checklist content for **active** operations.
**Billing:** Mollie sole active provider · **Mode:** SAFE CONTROLLED PRODUCTION MODE (`MOLLIE_LIVE_CHARGING_ENABLED=false`) until P1-002 + LIVE approval.

**Do not mark complete without owners and timestamps.**

---

## A. Environment validation

- [ ] `.env.example` reviewed against Vercel Production secrets
- [ ] `NEXT_PUBLIC_APP_URL` is `https://app.auroranexis.com` (no localhost; not www for app/billing)
- [ ] Supabase URL / anon / service role set (service role server-only)
- [ ] `MOLLIE_API_KEY` set (prefer `test_` for controlled mode)
- [ ] `MOLLIE_BILLING_ROLLOUT=true`
- [ ] `MOLLIE_LIVE_CHARGING_ENABLED=false` (required until LIVE approval)
- [ ] Optional `MOLLIE_BILLING_ORG_ALLOWLIST` reviewed
- [ ] Legacy FastSpring/Paddle/Stripe checkout keys **removed** from Production
- [ ] `CRON_SECRET` set; cron Authorization works
- [ ] Email provider configured and domain verified
- [ ] `SENTRY_DSN` / `NEXT_PUBLIC_POSTHOG_KEY` / `INTEGRATION_SECRET_KEY` set
- [ ] Turnstile keys set; `TURNSTILE_DISABLE` **unset**
- [ ] `E2E_DISABLE_RATE_LIMIT` **unset**
- [ ] `DEV_FORCE_PLAN` **unset**
- [ ] Analytics keys consent-gated
- [ ] `auditProductionEnvironment()` reports `readyForCustomers: true`

## B. Migration validation

- [ ] Migration list reviewed (timestamp-ordered SQL files)
- [ ] Staging migrations applied successfully before production
- [ ] White-label + `20250824140000_public_api_service_role_grants.sql` applied if required
- [ ] No experimental / incomplete migrations in the release train
- [ ] Backup / PITR available on Supabase project
- [ ] Rollback plan understood (forward-only; restore if needed)

## C. Pipeline validation

- [ ] `npm run lint` pass
- [ ] `npm run typecheck` pass
- [ ] `npm run test:production-readiness` pass
- [ ] `npm run test:enterprise-regression` pass
- [ ] `npm run build` pass
- [ ] CI workflow green on release commit (`.github/workflows/ci.yml`)

## D. Billing validation (Mollie)

- [ ] `NEXT_PUBLIC_APP_URL` equals `https://app.auroranexis.com` (per-resource webhook base)
- [ ] Production callback path is `/api/mollie/webhook` via `buildMollieWebhookUrl()` (payment **and** subscription create supply `webhookUrl`)
- [ ] **DASHBOARD_WEBHOOK_REQUIRED = NO** — Mollie Dashboard webhook registration is **not** required for go-live
- [ ] Next-Gen Dashboard webhooks are **not** configured against the classic endpoint
- [ ] Idempotency confirmed on staging (`mollie_webhook_events`)
- [ ] Checkout creates/updates subscription entitlements via webhook reconcile (not browser callback)
- [ ] Invoice / transaction history org-scoped
- [ ] Payment failure path degrade-safe (no entitlement from client callback alone)
- [ ] `MOLLIE_LIVE_CHARGING_ENABLED` remains false for controlled mode
- [ ] Historical Stripe/Paddle/FastSpring rows remain read-only archive and never drive checkout
- [ ] `/api/fastspring/*` remains 410 Gone

## E. Portal validation

- [ ] Portal login / logout
- [ ] Dashboard, reports, risks, incidents, health visibility
- [ ] Downloads / legal pages reachable
- [ ] Org isolation (no cross-tenant data)

## F. Authentication validation

- [ ] Login, logout, registration, password reset, email verification
- [ ] Session refresh / expiration behaviour
- [ ] Protected routes + permission redirects
- [ ] Supabase Auth redirect allow-list matches production URLs

## G. Authorization / tenancy

- [ ] RBAC roles intact (Owner → Readonly / portal)
- [ ] RLS still enforced (no service-role leakage to client)
- [ ] Organization / workspace / portal isolation spot-checked

## H. Analytics validation

- [ ] Consent banner gates marketing/analytics sinks
- [ ] No PII / secrets in event props
- [ ] Conversion events fire on pricing / signup / billing (staging)
- [ ] PostHog `$pageview` only after analytics consent

## I. SEO validation

- [ ] `robots.txt` disallows private prefixes
- [ ] Sitemap excludes auth/dashboard/portal
- [ ] Canonical host www; apex redirects exclude `/api`
- [ ] Noindex on auth and preview hosts

## J. Accessibility validation

- [ ] Skip links / main landmarks on major shells
- [ ] Dialogs focus-trap; tables have column scope
- [ ] Keyboard path through login and primary CTAs

## K. Internationalization validation

- [ ] Organization currency / locale / timezone persist
- [ ] Money and dates use central formatters (no hardcoded `$` on sales surfaces)

## L. Performance validation

- [ ] Dashboard loads under normal workspace size
- [ ] Heavy workspaces remain dynamically imported
- [ ] Cron / queue not overlapping destructively

## M. Regression validation

- [ ] Chapter 13 enterprise regression suite green
- [ ] No intentional API contract changes in the release

## N. Monitoring validation

- [ ] `/api/health` and `/api/ready` monitored
- [ ] Error reporting (Sentry) receiving events from staging/prod
- [ ] Queue / webhook diagnostics reviewed
- [ ] Health payload billing flag reflects Mollie (`configuration.mollie`)

## O. Rollback readiness

- [ ] Previous Vercel deployment identified for instant rollback
- [ ] [rollback-plan.md](./rollback-plan.md) reviewed by on-call
- [ ] Mollie webhook incident steps known (`MOLLIE_LIVE_CHARGING_ENABLED=false` / deploy rollback; Dashboard registration not required)
- [ ] Supabase PITR / backup restore owner assigned
- [ ] P1-002 legal/tax gate understood before any LIVE charging enablement

## Sign-off

| Role | Name | Date |
|------|------|------|
| Engineering | | |
| Founder / Product | | |
| On-call | | |
| Legal/tax (LIVE revenue only) | | |
