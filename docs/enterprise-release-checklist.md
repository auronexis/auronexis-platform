# Enterprise Release Checklist

**Canonical** go-live checklist. Use before promoting staging → production.  
Supersedes Stripe-era `release-checklist.md` / `production-checklist.md` content.

**Do not mark complete without owners and timestamps.**

---

## A. Environment validation

- [ ] `.env.example` reviewed against Vercel Production secrets
- [ ] `NEXT_PUBLIC_APP_URL` is HTTPS production host (no localhost)
- [ ] Supabase URL / anon / service role set (service role server-only)
- [ ] `PADDLE_ENVIRONMENT=production` with live API key, webhook secret, client token
- [ ] Paddle price IDs mapped for sold plans
- [ ] `CRON_SECRET` set; cron Authorization works
- [ ] Email provider configured and domain verified
- [ ] Turnstile keys set; `TURNSTILE_DISABLE` **unset**
- [ ] `E2E_DISABLE_RATE_LIMIT` **unset**
- [ ] `DEV_FORCE_PLAN` **unset**
- [ ] Analytics keys optional and consent-gated
- [ ] `auditProductionEnvironment()` reports `readyForCustomers: true`

## B. Migration validation

- [ ] Migration list reviewed (67 timestamp-ordered SQL files)
- [ ] Staging migrations applied successfully before production
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

## D. Billing validation (Paddle)

- [ ] Webhook URL `/api/paddle/webhook` registered in Paddle dashboard
- [ ] Signature verification + idempotency confirmed on staging
- [ ] Checkout creates/updates subscription entitlements
- [ ] Customer portal opens only with verified Paddle customer
- [ ] Invoice / transaction history org-scoped
- [ ] Payment failure path degrade-safe (no entitlement from client callback alone)

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
- [ ] Health payload billing flag reflects Paddle (`configuration.paddle`)

## O. Rollback readiness

- [ ] Previous Vercel deployment identified for instant rollback
- [ ] [rollback-plan.md](./rollback-plan.md) reviewed by on-call
- [ ] Paddle webhook disable / secret rotate steps known
- [ ] Supabase PITR / backup restore owner assigned

## Sign-off

| Role | Name | Date |
|------|------|------|
| Engineering | | |
| Founder / Product | | |
| On-call | | |
