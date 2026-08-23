# Final Pre-Live Production Certification Audit v1.0

**Platform:** Auroranexis SaaS  
**Repository:** `D:\Projekt.01\Auroranexis`  
**Audit date:** 2026-08-23 (UTC+2)  
**Auditor mode:** Chapter 18 — audit only (no code fixes, no deploy, no config changes)  
**Branch HEAD:** `ba406b2` — `fix: align production readiness and CI gates with Mollie-only billing`  
**Working tree:** clean (`git status --short` empty at audit time)

---

## Audit methodology

| Phase | Scope | Status |
|-------|--------|--------|
| A — Inventory | Routes, API, billing, security, migrations, env, CI, tests | **CODE PRESENT** |
| B — Static audit | Security, billing lifecycle, RLS, operator endpoints, legacy provider refs | **CODE PRESENT** |
| C — Automated verification | lint, typecheck, build, production-readiness, enterprise-regression, Mollie suite, certification gates | **RUNTIME VERIFIED (local)** |
| D — Adversarial/negative | IDOR, operator auth, webhook replay, query-param entitlement (source analysis) | **CODE PRESENT** |
| E — UI/UX surface | Static component/route analysis | **CODE PRESENT** (browser runtime **NOT VERIFIED**) |
| F — Legal/compliance | Imprint, privacy, terms, refund, pricing consistency | **CODE PRESENT** (legal counsel **NOT VERIFIED**) |
| G — Production/infrastructure | `.env.example`, `vercel.json`, cron, Mollie gating, SMTP | **CODE PRESENT** (Vercel production env **NOT VERIFIED**) |
| H — Financial invariants | 15 cross-system billing invariants | **CODE PRESENT** |
| I — Certification report | This document | Complete |

**Distinction:** Findings marked **CODE PRESENT** are evidenced from repository source, migrations, and local test runs. **RUNTIME VERIFIED** requires the command or environment stated. **NOT VERIFIED** means production/staging/browser/operator env was not inspected during this audit.

---

## A. EXECUTIVE VERDICT

### **READY FOR CONTROLLED LIVE PILOT**

The codebase passes all locally executed CI-equivalent gates (lint warnings only, typecheck clean, build success, 383 enterprise-regression tests, 249 Mollie billing contract tests, certification/release/go-live/DoD suites). Mollie is the sole active checkout provider with LIVE charging kill-switch logic **CODE PRESENT** default-off.

**Controlled pilot scope:** TEST-mode Mollie (`test_` API key), `MOLLIE_LIVE_CHARGING_ENABLED=false`, operator-cleared production env (SMTP, CRON_SECRET, rollout flags), and completion of legal MoR/tax review (`LEGAL_REVIEW_REQUIRED`).

**Not certified:** Full revenue LIVE charging, legal sign-off, production Vercel env parity, Playwright E2E runtime, or browser UX walkthrough.

---

## B. RELEASE MATRIX (12 domains)

| # | Domain | Verdict | Evidence |
|---|--------|---------|----------|
| 1 | **Security (auth/RBAC/tenant)** | **PASS** | `requireSession`, `requireModuleAccess`, `withApiHandler` + scopes, login/signup/reset throttles (`src/lib/security/login-throttle.ts`), middleware session refresh, CSP/HSTS in `vercel.json` |
| 2 | **Billing / Mollie lifecycle** | **PASS WITH OBSERVATIONS** | `getActiveBillingProvider()` → `"mollie"`; webhook API re-fetch + idempotency; cancellation withdrawal; 249/249 Mollie tests pass; stale comment in `active-billing.ts` (P2) |
| 3 | **Database / RLS** | **PASS WITH OBSERVATIONS** | RLS on `organization_subscriptions`, `mollie_webhook_events`, `transactional_email_deliveries`; service-role used server-side for webhooks/email — **production policy review NOT VERIFIED** |
| 4 | **Email lifecycle** | **PARTIAL** | SMTP path + `transactional_email_deliveries` ledger **CODE PRESENT**; production SMTP delivery **NOT VERIFIED** |
| 5 | **Legal / compliance** | **PARTIAL** | Imprint/privacy/terms/refund/DPA pages **CODE PRESENT**; Mollie named in legal copy; `LEGAL_REVIEW_REQUIRED` for MoR/tax — counsel sign-off **NOT VERIFIED** |
| 6 | **Infrastructure / env** | **PARTIAL** | `.env.example` Mollie-first; cron `*/5 * * * *`; Vercel headers; production env values **NOT VERIFIED** |
| 7 | **CI / quality gates** | **PASS** | `.github/workflows/ci.yml` matches local runs; all executed suites green |
| 8 | **Public API** | **PASS WITH OBSERVATIONS** | v1 routes use auth + rate limits; tenant scoping in resource handlers — live penetration **NOT VERIFIED** |
| 9 | **UI / UX (product)** | **PARTIAL** | 156+ App Router pages build; billing panels wired; browser smoke **NOT VERIFIED** |
| 10 | **SEO / public web** | **PASS** | Technical SEO contracts in enterprise-regression (robots, sitemap, noindex private routes) |
| 11 | **Observability** | **PARTIAL** | Sentry/PostHog optional in `.env.example`; production DSN wiring **NOT VERIFIED** |
| 12 | **Dependencies** | **PARTIAL** | `npm audit`: 9 vulnerabilities (2 moderate, 7 high) — see P1-003 |

---

## C. FINDING COUNTS

| Severity | Count | Notes |
|----------|-------|-------|
| **P0** | **0** | No proven critical security or billing logic blocker in code + local CI gates |
| **P1** | **4** | Operator env, legal review, dependency audit, LIVE flag runtime |
| **P2** | **8** | Documentation drift, retained legacy surfaces, lint warnings, E2E not run |
| **P3** | **3** | Tooling noise, minor DX |

---

## D. P0 BLOCKERS

**None identified** in this audit pass. Local CI-equivalent verification completed without failures.

---

## E. P1 MUST FIX (before LIVE revenue / full production promote)

### P1-001 — Production environment operator sign-off NOT VERIFIED

| Field | Value |
|-------|-------|
| **ID** | P1-001 |
| **TITLE** | Production Vercel env parity unverified |
| **SEVERITY** | P1 |
| **DOMAIN** | Infrastructure |
| **AFFECTED** | Vercel Production project, `.env.example`, `src/lib/env/production-audit.ts` |
| **EVIDENCE** | `auditProductionEnvironment()` marks `MOLLIE_BILLING_ROLLOUT`, `CRON_SECRET`, `MOLLIE_API_KEY`, SMTP as required/recommended; audit ran on local repo only |
| **REPRODUCTION** | Operator opens Vercel Production env vs `docs/enterprise-release-checklist.md` |
| **EXPECTED** | All required keys set; `MOLLIE_LIVE_CHARGING_ENABLED` absent or `false`; `EMAIL_PROVIDER=smtp` with STRATO credentials |
| **ACTUAL** | **NOT VERIFIED** in this audit |
| **IMPACT** | Cron jobs, billing webhooks, transactional email may fail silently in production |
| **REMEDIATION** | Operator checklist sign-off per Chapter 19 conditions |
| **REGRESSION RISK** | Low (config only) |
| **REQUIRED TEST** | `/api/health`, `/api/ready`, cron probe with Bearer secret, test transactional email |

### P1-002 — LEGAL_REVIEW_REQUIRED (MoR / tax under Mollie)

| Field | Value |
|-------|-------|
| **ID** | P1-002 |
| **TITLE** | Merchant-of-record / tax legal review outstanding |
| **SEVERITY** | P1 |
| **DOMAIN** | Legal/compliance |
| **AFFECTED** | `docs/mollie-provider-consolidation-final.md`, `src/lib/company/legal-content.ts` (terms, refund, privacy) |
| **EVIDENCE** | Doc explicitly marks `LEGAL_REVIEW_REQUIRED`; legal pages state Mollie processes payments but do not claim legal certification |
| **REPRODUCTION** | Read consolidation final report § legal conditions |
| **EXPECTED** | Counsel review of MoR, VAT, refund/chargeback wording before LIVE charging |
| **ACTUAL** | Flag present; counsel attestation **NOT VERIFIED** |
| **IMPACT** | Regulatory / contract risk at LIVE revenue |
| **REMEDIATION** | External legal review; update legal pages if counsel requires |
| **REGRESSION RISK** | Low (copy only) |
| **REQUIRED TEST** | Legal sign-off recorded in release checklist |

### P1-003 — npm audit reports 7 high / 2 moderate vulnerabilities

| Field | Value |
|-------|-------|
| **ID** | P1-003 |
| **TITLE** | Transitive dependency vulnerabilities (Next.js, postcss, sharp, etc.) |
| **SEVERITY** | P1 |
| **DOMAIN** | Dependencies |
| **AFFECTED** | `package.json` → `next@^15.3.3` (resolved 15.5.19 in build), transitive `postcss`, `sharp`, `brace-expansion`, `js-yaml`, `nanoid`, `dompurify`, `fast-uri` |
| **EVIDENCE** | `npm audit --audit-level=moderate` exit 1 — 9 vulnerabilities reported |
| **REPRODUCTION** | Run `npm audit` in repo root |
| **EXPECTED** | No high-severity open issues at production promote, or documented accepted risk |
| **ACTUAL** | 9 open issues; `npm audit fix` suggested |
| **IMPACT** | DoS/XSS/SSRF class issues in framework/transitives |
| **REMEDIATION** | Operator dependency upgrade window; re-run audit + full regression |
| **REGRESSION RISK** | Medium (Next/sharp upgrades) |
| **REQUIRED TEST** | `npm run build`, `npm run test:enterprise-regression` after upgrade |

### P1-004 — MOLLIE_LIVE_CHARGING_ENABLED production runtime NOT VERIFIED

| Field | Value |
|-------|-------|
| **ID** | P1-004 |
| **TITLE** | LIVE charging kill-switch state in production unknown |
| **SEVERITY** | P1 |
| **DOMAIN** | Billing |
| **AFFECTED** | `MOLLIE_LIVE_CHARGING_ENABLED`, `src/lib/billing/providers/mollie/rollout.ts`, `src/app/api/mollie/webhook/route.ts` |
| **EVIDENCE** | `.env.example` documents `# MOLLIE_LIVE_CHARGING_ENABLED=false`; `isMollieLiveChargingEnabled()` defaults false when unset; webhook returns 503 for `live_` key when flag false |
| **REPRODUCTION** | Inspect Vercel Production env (do not log secret values) |
| **EXPECTED** | Unset or explicitly `false` until go-live approval |
| **ACTUAL** | **CODE PRESENT** safe default; **RUNTIME NOT VERIFIED** |
| **IMPACT** | Accidental LIVE charges if mis-set |
| **REMEDIATION** | Operator confirms false; document in release checklist |
| **REGRESSION RISK** | None if kept false |
| **REQUIRED TEST** | Diagnostics panel / env audit in staging mirror |

---

## F. P2 / P3 SUMMARY

### P2

| ID | Title | Domain | Affected |
|----|-------|--------|----------|
| P2-001 | Stale header comment "FastSpring is sole active billing provider" | Billing docs-in-code | `src/lib/billing/active-billing.ts:6-8` |
| P2-002 | Legacy FastSpring/Paddle/Stripe detection helpers retained | Technical debt | `src/lib/billing/active-billing.ts`, `checkout-eligibility.ts`, diagnostics |
| P2-003 | FastSpring API routes retained as 410 Gone stubs | Architecture | `/api/fastspring/webhook`, `/api/fastspring/connectivity` — **SAFE TO RETAIN** |
| P2-004 | `src/lib/fastspring/sync.ts` archive module still present | Technical debt | Historical read-only sync — **SAFE TO RETAIN** per debt catalog |
| P2-005 | ESLint warnings (no-img-element, unused vars) | Code quality | 17 warnings, exit 0 |
| P2-006 | Playwright E2E not executed in this audit | Testing | `npm run test:e2e` — **NOT VERIFIED** |
| P2-007 | Browser UX runtime not inspected | UI/UX | All dashboard/billing flows — **NOT VERIFIED** |
| P2-008 | Resend still referenced in legal sub-processors while SMTP is production path | Legal/copy | `legal-content.ts` subprocessors list |

### P3

| ID | Title |
|----|-------|
| P3-001 | `next lint` deprecation notice (Next.js 16 migration) |
| P3-002 | npm `Unknown env config "devdir"` warning on every command |
| P3-003 | Build loads `.env.production.local` / `.env.local` (expected locally; secrets not audited) |

---

## G. BILLING CERTIFICATION MATRIX

| Capability | Code | Tests | Runtime |
|------------|------|-------|---------|
| Sole provider = Mollie | ✅ `getActiveBillingProvider()` | ✅ mollie-sole-provider | N/A |
| First purchase / mandate | ✅ production-checkout | ✅ phase4 tests | NOT VERIFIED |
| Renewal / period advance | ✅ billing-period + webhook | ✅ repair tests | NOT VERIFIED |
| Upgrade (prorated payment) | ✅ upgrade-payment | ✅ 18 forensic tests | NOT VERIFIED |
| Downgrade (scheduled) | ✅ pending_plan_change | ✅ phase4-1 tests | NOT VERIFIED |
| Cancel at period end | ✅ lifecycle + Mollie API cancel | ✅ final-lifecycle tests | NOT VERIFIED |
| Cancellation withdrawal | ✅ cancellation-withdrawal | ✅ tests 8–15 | NOT VERIFIED |
| Webhook idempotency | ✅ mollie_webhook_events | ✅ idempotency tests | NOT VERIFIED |
| Return page non-authoritative | ✅ mollie/return page | ✅ query-param tests | NOT VERIFIED |
| LIVE kill switch | ✅ rollout.ts + webhook gate | ✅ env contract tests | **NOT VERIFIED in prod** |
| FastSpring retirement | ✅ 410 routes; no checkout | ✅ sole-provider tests | N/A |
| Operator recovery | ✅ `/api/operator/mollie/paid-purchase-recovery` | ✅ recovery tests | NOT VERIFIED |
| Historical FastSpring rows protected | ✅ checkout-eligibility guards | ✅ overwrite guards | N/A |

**Billing verdict:** **PASS WITH OBSERVATIONS** for TEST-mode controlled pilot; **NOT READY** for LIVE charging until P1-001, P1-002, P1-004 cleared.

---

## H. SECURITY CERTIFICATION MATRIX

| Control | Status | Evidence |
|---------|--------|----------|
| Session auth (Supabase SSR) | CODE PRESENT | `updateSession` middleware, `requireSession` |
| RBAC route guards | CODE PRESENT | `requireModuleAccess`, `canManageOrganizationSettings` |
| RLS tenant isolation | CODE PRESENT | Migrations enable RLS on subscription/email/webhook tables |
| IDOR (API v1) | CODE PRESENT | `withApiHandler` + org-scoped resource queries |
| Operator endpoints | CODE PRESENT | `verifyCronAuthorization` on cron + operator recovery |
| Webhook replay | CODE PRESENT | Idempotency ledger + payload hash mismatch → unavailable |
| Secrets server-only | CODE PRESENT | No `NEXT_PUBLIC_` Mollie keys; eslint Stripe import ban |
| Rate limiting | CODE PRESENT | Login/signup/reset throttles; API rate limits by plan |
| Security headers | CODE PRESENT | CSP, HSTS, X-Frame-Options in `vercel.json` + middleware |
| CAPTCHA removed safely | CODE PRESENT | enterprise-regression auth-without-captcha suite |
| service_role usage | CODE PRESENT | Admin client in webhooks/billing/email — expected; leak to client forbidden |
| Production cron auth fail-closed | CODE PRESENT | `verifyCronAuthorization` returns false without CRON_SECRET outside dev |

**Security verdict:** **PASS WITH OBSERVATIONS** — no P0 static findings; production penetration and RLS policy review **NOT VERIFIED**.

---

## I. LEGAL / COMPLIANCE MATRIX

| Item | Route | Status |
|------|-------|--------|
| Imprint (Impressum) | `/imprint`, `/legal/imprint` | CODE PRESENT — §5 DDG structure |
| Privacy | `/privacy`, `/legal/privacy` | CODE PRESENT — Mollie named as processor |
| Terms | `/terms`, `/legal/terms` | CODE PRESENT |
| Refund policy | `/refund-policy` | CODE PRESENT — Mollie, cancellation vs refund |
| Cookies | `/cookies`, `/legal/cookies` | CODE PRESENT |
| DPA | `/data-processing-agreement` | CODE PRESENT |
| Sub-processors | `/subprocessors` | CODE PRESENT — lists Mollie, Supend, Vercel, Resend |
| Security policy | `/security-policy` | CODE PRESENT |
| Acceptable use | `/acceptable-use` | CODE PRESENT |
| Pricing consistency | `/pricing` | CODE PRESENT — `SUBSCRIPTION_PLANS` USD 179/599/1799 |
| GDPR certification claim | — | **Not claimed** (explicit non-certification language) |
| Legal counsel review | — | **NOT VERIFIED** (P1-002) |

**Legal verdict:** **PARTIAL** — pages exist and align with Mollie; external legal sign-off required before LIVE revenue.

---

## J. UI/UX VERDICT

| Area | Assessment |
|------|------------|
| Marketing/legal surfaces | Build includes imprint, privacy, terms, refund, pricing — **CODE PRESENT** |
| Billing settings | `billing-settings-panel`, Mollie management panel, withdrawal modal — **CODE PRESENT** |
| FastSpring test UI | Redirects to Mollie test — **CODE PRESENT** |
| Return/confirm UX | Non-authoritative copy on Mollie return pages — **CODE PRESENT** |
| Accessibility | Chapter 10 regression contracts pass in enterprise suite — **CODE PRESENT** |
| Browser runtime | **NOT VERIFIED** — no Playwright/browser session in this audit |

**UI/UX verdict:** **PARTIAL** — static/build evidence strong; operator should run manual smoke on staging before pilot customers.

---

## K. INFRASTRUCTURE VERDICT

| Component | Finding |
|-----------|---------|
| **Hosting** | Vercel (`vercel.json` crons, redirects, security headers) — **CODE PRESENT** |
| **Cron** | `/api/cron/run` every 5 minutes — matches production-readiness contract |
| **Database** | 74 Supabase migrations, ordered — **CODE PRESENT** |
| **Email** | SMTP STRATO path documented; `EMAIL_PROVIDER=smtp` — production delivery **NOT VERIFIED** |
| **Mollie** | Sole provider; classic webhook only; LIVE gated — **CODE PRESENT** |
| **CI** | GitHub Actions: lint, typecheck, readiness, DoD, certification, release, golive, regression, build |
| **Secrets** | `.env.example` tracked; real secrets in local `.env*` not inspected (values not logged) |

**Infrastructure verdict:** **PARTIAL** — architecture ready; operator production env sign-off required (P1-001).

---

## L. TEST RESULTS (actual commands)

Environment: Windows, Node/npm (local), repo `D:\Projekt.01\Auroranexis`, 2026-08-23.

### `npm run lint`

- **Exit:** 0 (warnings only)
- **Result:** 17 warnings — `@next/next/no-img-element` (5 files), `@typescript-eslint/no-unused-vars` (12 locations)
- **No errors**

### `npm run typecheck`

- **Exit:** 0
- **Result:** `tsc --noEmit` clean

### `npm run build`

- **Exit:** 0
- **Result:** Next.js 15.5.19 compiled; 220 static pages; middleware 214 kB
- **Note:** Used local `.env.production.local`, `.env.local` (secrets not recorded)

### `npm run test:production-readiness`

- **Exit:** 0
- **Result:** 17/17 pass

### `npm run test:enterprise-regression`

- **Exit:** 0
- **Result:** 383/383 pass (4 suites)

### `npm run test:mollie-billing`

- **Exit:** 0
- **Result:** 249/249 pass

### `npm run test:enterprise-certification`

- **Exit:** 0
- **Result:** 13/13 pass

### `npm run test:enterprise-release-approval`

- **Exit:** 0
- **Result:** 11/11 pass

### `npm run test:enterprise-production-golive`

- **Exit:** 0
- **Result:** 12/12 pass

### `npm run test:definition-of-done`

- **Exit:** 0
- **Result:** 11/11 pass (includes src scan: no TODO/FIXME/HACK)

### `npm audit --audit-level=moderate`

- **Exit:** 1
- **Result:** 9 vulnerabilities (2 moderate, 7 high) — see P1-003

### Not executed

| Command | Reason |
|---------|--------|
| `npm run test:e2e` | Out of CI local audit scope; credentials-dependent |
| Production HTTP smoke | No production deploy from audit |
| Mollie LIVE webhook end-to-end | LIVE charging prohibited |

---

## M. OPERATOR-ONLY CHECKS (manual — NOT VERIFIED in audit)

1. Confirm Vercel Production: `MOLLIE_LIVE_CHARGING_ENABLED` unset or `false`
2. Confirm `MOLLIE_BILLING_ROLLOUT=true` only when ready for self-serve TEST checkout
3. Confirm `MOLLIE_API_KEY` prefix matches intended mode (`test_` for pilot)
4. Configure Mollie Dashboard webhook → `https://www.auroranexis.com/api/mollie/webhook` (classic, not Next-Gen)
5. Set `CRON_SECRET`; verify Vercel cron invokes `/api/cron/run` with Bearer auth
6. Configure STRATO SMTP (`SMTP_*`, `EMAIL_FROM=noreply@auroranexis.com`); send test transactional email
7. Run pilot smoke: signup → login → Mollie TEST checkout → webhook → entitlement → cancel → withdrawal
8. Complete `docs/enterprise-release-checklist.md` sign-off including P1-002 legal review
9. Run `npm run test:e2e` with `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` in CI or staging
10. Review Supabase RLS policies in dashboard for production project
11. Remove legacy FastSpring env vars from Vercel if still present (documented LEGACY in `.env.example`)
12. After dependency upgrade (P1-003), re-run full CI suite before promote

---

## N. REQUIRED FIX ORDER

1. **P1-001** — Production env operator verification (blocking operational go-live)
2. **P1-004** — Confirm LIVE charging flag false in production
3. **P1-002** — Legal MoR/tax review
4. **P1-003** — Dependency audit remediation plan
5. **P2-006 / P2-007** — Staging E2E + manual UX smoke
6. **P2-001 / P2-008** — Copy/doc drift cleanup (non-blocking for TEST pilot)

---

## O. LIVE CHARGING STATUS

| Check | Result |
|-------|--------|
| `.env.example` documents default | **CODE PRESENT:** `# MOLLIE_LIVE_CHARGING_ENABLED=false` (commented template) |
| `isMollieLiveChargingEnabled()` when unset | **CODE PRESENT:** returns `false` |
| Webhook with `live_` key + flag false | **CODE PRESENT:** HTTP 503 |
| Operator recovery with LIVE enabled | **CODE PRESENT:** HTTP 403 |
| **Vercel Production runtime value** | **NOT VERIFIED** |

**Audit assertion:** This audit did **not** enable live charging. Operators must keep `MOLLIE_LIVE_CHARGING_ENABLED=false` until explicit LIVE approval.

---

## P. FINAL GO/NO-GO

| Gate | Decision |
|------|----------|
| **Controlled TEST pilot** (Mollie test key, no LIVE charges) | **GO** — subject to P1-001 operator env + staging smoke |
| **LIVE revenue / full production promote** | **NO-GO** — until P1-001, P1-002, P1-003, P1-004 cleared |
| **Code commit from this audit** | **NO** — audit doc only |

---

## PHASE A — INVENTORY

### Application routes (summary)

| Category | Count / notes |
|----------|----------------|
| App Router pages | 156+ `page.tsx` files; build emitted 220 routes |
| API route handlers | 41 `route.ts` under `src/app/api` and exports |
| Key billing API | `/api/mollie/webhook`, `/api/mollie/connectivity`, `/api/operator/mollie/paid-purchase-recovery` |
| Retired billing API | `/api/fastspring/webhook` (410), `/api/fastspring/connectivity` (410) |
| Cron | `/api/cron/run` |
| Health | `/api/health`, `/api/ready`, `/api/status` |
| Public API v1 | `/api/v1/*` (clients, incidents, risks, reports, automation, ai, me, integrations, predictive, activity) |

### Billing modules (`src/lib/billing/providers/mollie/`)

checkout, production-checkout, webhooks, lifecycle, lifecycle-status, organization-sync, upgrade-payment, cancellation-withdrawal, billing-period, billing-period-repair, idempotency-key, paid-purchase-recovery, rollout, mode, sync, return-state, transactions, payment-classification, foundation, client, env

### Migrations

74 files under `supabase/migrations/` — foundation through Mollie upgrade payment attempt (`20250822020000_mollie_upgrade_payment_attempt.sql`), transactional email (`20250821100000_transactional_email_system.sql`)

### Environment template (`.env.example`)

Mollie sole provider; FastSpring/Paddle/Stripe marked LEGACY; SMTP production path; `CRON_SECRET`; `MOLLIE_LIVE_CHARGING_ENABLED=false` documented; no secrets committed

### CI (`.github/workflows/ci.yml`)

Node 22, `npm ci`, lint, typecheck, production-readiness, definition-of-done, enterprise-certification, enterprise-release-approval, enterprise-production-golive, enterprise-regression, build (with placeholder Supabase + `MOLLIE_LIVE_CHARGING_ENABLED: "false"`)

### Test scripts (selected)

`test:enterprise-regression`, `test:mollie-billing`, `test:production-readiness`, `test:enterprise-certification`, `test:e2e` (Playwright)

---

## PHASE B — STATIC AUDIT HIGHLIGHTS

### Security

- Cron and operator recovery require Bearer `CRON_SECRET` (`src/lib/env.ts:75-86`)
- Mollie webhook has no session auth (expected); relies on payment id + API re-fetch + org ownership validation in reconcile path
- No `TODO`/`FIXME`/`HACK` in `src/` (verified by DoD test scan)

### Legacy provider references (global search classification summary)

| Term | Primary classification | Notes |
|------|------------------------|-------|
| **Mollie** | **ACTIVE** | Sole checkout provider |
| **FastSpring** (API routes) | **DEAD CODE / SAFE TO RETAIN** | 410 Gone retirement stubs |
| **FastSpring** (DB rows/docs) | **HISTORICAL / DOCUMENTATION** | Historical `billing_provider='fastspring'` |
| **Paddle** | **HISTORICAL / DEAD CODE helpers** | Detection only; 0 usable subs per docs |
| **Stripe** | **HISTORICAL / ARCHIVE** | Column names + neutralization maintenance |
| **LEGAL_REVIEW_REQUIRED** | **DOCUMENTATION** | `docs/mollie-provider-consolidation-final.md` |
| **TODO/FIXME/HACK** | **None in src/** | Scripts/docs may reference as test targets |
| **service_role** | **SECURITY-SENSITIVE** | Server-only admin client; grants in migrations |
| **CRON_SECRET** | **SECURITY-SENSITIVE** | Documented server-only |

### Stale comment (P2-001)

`src/lib/billing/active-billing.ts` header still says "FastSpring is the sole active billing provider" while `getActiveBillingProvider()` returns `"mollie"`. Misleading for operators; not a runtime bug.

---

## PHASE D — ADVERSARIAL / NEGATIVE TESTING (source analysis)

| Threat | Mitigation observed | Verdict |
|--------|---------------------|---------|
| **IDOR on API v1** | Auth context binds org; handlers use ctx-scoped queries | CODE PRESENT — pass |
| **IDOR on operator recovery** | No session; requires CRON_SECRET | CODE PRESENT — pass |
| **Webhook replay** | `mollie_webhook_events` unique key; duplicate → 200 duplicate; hash mismatch → unavailable | CODE PRESENT — pass |
| **Query-param entitlement grant** | Return pages resolve authoritative DB/webhook state; tests assert query alone cannot activate Business | CODE PRESENT — pass |
| **DEV_FORCE_PLAN in production** | Ignored by `getDevForcePlanOverride()` in production | CODE PRESENT — pass |
| **E2E rate limit bypass** | Blocked when `NODE_ENV=production` | CODE PRESENT — pass |
| **FastSpring webhook processing** | 410 Gone — no processing | CODE PRESENT — pass |

No destructive production tests were run.

---

## PHASE H — 15 FINANCIAL INVARIANTS

| # | Invariant | Status |
|---|-----------|--------|
| 1 | Entitlements resolve via `resolveOrganizationEntitlements` after verified subscription state — not browser callbacks | CODE PRESENT |
| 2 | Mollie webhook re-fetches Payment from API before mutating org subscription | CODE PRESENT |
| 3 | Webhook events are idempotent via `mollie_webhook_events` | CODE PRESENT |
| 4 | Payload hash mismatch rejects ambiguous replay | CODE PRESENT |
| 5 | LIVE payment writes require `MOLLIE_LIVE_CHARGING_ENABLED` | CODE PRESENT |
| 6 | TEST write paths call `assertMollieTestModeOnly` where required | CODE PRESENT |
| 7 | Mollie sync refuses to overwrite historical FastSpring ownership | CODE PRESENT |
| 8 | Charge amounts derive from `SUBSCRIPTION_PLANS` catalog only | CODE PRESENT |
| 9 | Cancel-at-period-end preserves paid-through access (`resolveSubscriptionUsability`) | CODE PRESENT |
| 10 | Upgrades update existing `sub_` — no second subscription create on success path | CODE PRESENT |
| 11 | Duplicate paid first payments detectable via operator analyze-duplicates | CODE PRESENT |
| 12 | Billing emails idempotent via `transactional_email_deliveries` ledger | CODE PRESENT |
| 13 | `organization_subscriptions` RLS limits authenticated reads to own org | CODE PRESENT |
| 14 | Operator financial recovery requires CRON_SECRET | CODE PRESENT |
| 15 | Return URL query parameters do not grant plan upgrades | CODE PRESENT |

**Invariant analysis verdict:** All 15 invariants **CODE PRESENT**; live financial flows **NOT VERIFIED** end-to-end in this audit.

---

## Appendix — Git state at audit completion

```
git status --short
(empty — clean working tree)

git log -5 --oneline
ba406b2 fix: align production readiness and CI gates with Mollie-only billing
dc1b6f7 docs: professionalize refund policy; scrub public FastSpring references
51dc167 chore: scrub remaining FastSpring customer-facing labels
ba80117 chore: retire FastSpring; consolidate Mollie as sole billing provider
5367c8e feat: mollie cancellation withdrawal and renewal lifecycle hardening
```

---

*End of Final Pre-Live Production Certification Audit v1.0*
