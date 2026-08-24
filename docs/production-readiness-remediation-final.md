# Production Readiness Remediation — Final Report

**Date:** 2026-08-24  
**Scope:** Phases 1–13 — truthful readiness remediation (no score inflation)

---

## 1. Executive verdict

### **GO WITH OPERATOR ACTION**

Engineering defects that falsely blocked or depressed readiness scores are fixed in this commit. Production promote remains gated on **operator observability configuration** (Sentry + PostHog) and **applying the new API `service_role` grants migration** in Supabase production.

Do **not** enable `MOLLIE_LIVE_CHARGING_ENABLED` until explicit billing cutover approval.

---

## 2. Root causes

### Monitoring (60/100, `monitoringReady=No`)

| Signal | Source | Threshold | Required? |
|--------|--------|-----------|-----------|
| Sentry DSN | `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` | configured | **Yes (prod)** |
| PostHog key | `NEXT_PUBLIC_POSTHOG_KEY` | configured | **Yes (prod)** |
| Health endpoint | `deployment.healthEndpointReady` | true | Yes |
| Status route | `MARKETING_ROUTES.status === "/status"` | true | Yes (code) |
| Security headers | `GO_LIVE_SECURITY_HEADERS.length >= 6` | true | Yes (code) |

**Root cause:** Category **C — operator config**. Production is missing Sentry and PostHog env vars → 3/5 checks pass → **60/100**. Not a code defect.

### OAuth (82 prod / 80 go-live, `oauthReady=No`)

| Signal | Source | Threshold | Required? |
|--------|--------|-----------|-----------|
| OAuth connector count | `ALL_CONNECTOR_CONFIGS` where `oauth !== "none"` | ≥ 13 | Platform capability |
| Google / Microsoft / Slack / Salesforce registered | connector definitions | present | Platform capability |

**Root cause:** Category **A — wrong detection**. Go-live counted only `oauth === "oauth2"`, excluding Google (`oauth2_pkce`) → 12/13 → 80/100. Production readiness penalized **optional provider env credentials** (`oauthConfiguredConnectors === 0`) instead of platform capability.

### API (40/100)

| Signal | Source | Threshold | Required? |
|--------|--------|-----------|-----------|
| `api_keys` reachable | admin probe | no error | **Yes** |
| `api_request_logs` reachable | admin probe | no error | **Yes** |
| Failure rate | `failedRequestsToday >= 5` | not high | Optional maturity |

**Root cause:** Category **B — missing implementation**. Public API migrations granted `authenticated` only; **`service_role` lacked GRANT** on `api_keys` / `api_request_logs` → admin diagnostics probe failed → `tableReachable=false` → **40/100** even when tables exist.

### Compliance (77/100)

| Signal | Source | Threshold | Required? |
|--------|--------|-----------|-----------|
| Tables reachable | `complianceTablesReachable()` | true | Platform |
| Framework maturity | `frameworkReadinessPercent` | < 40 → partial score | Tenant maturity |

**Root cause:** **Not a platform defect.** Low tenant compliance maturity (policies, audit volume, retention coverage) yields ~77 via `scorePlatformModule`. Separate from customer Compliance module UI — no certification claims.

### Predictive (65/100)

| Signal | Source | Threshold | Required? |
|--------|--------|-----------|-----------|
| Forecast count | `predictive.forecastCount > 0` | degraded if zero | **Optional** |

**Root cause:** Category **D — optional maturity**. Zero forecasts on a fresh tenant is expected pre-traffic. **Not a go-live blocker.**

### Search (Ctrl+K “Compliance” → no results)

**Root cause:** Category **B — missing implementation**. `global-search.tsx` used a static `QUICK_ACTIONS` list without Compliance or most primary modules; no RBAC/plan filtering.

### CSV / Excel audit export

**Root cause:** Category **B**. CSV used comma delimiter without UTF-8 BOM; German Excel opened as single column. No formula-injection prefix on `=`, `+`, `-`, `@`.

### Browser console preload warning

**Root cause:** `next/font` Inter configured with `preload: true` while font not used within browser preload window — **harmless Next.js behavior**. Set `preload: false` to silence.

---

## 3. Changes made

| Area | Change |
|------|--------|
| OAuth go-live | `countOAuthCapableConnectors()` includes `oauth2_pkce` |
| OAuth production score | Scores platform connector registration, not optional env credentials |
| API readiness | Migration `20250824140000_public_api_service_role_grants.sql` |
| Global search | `src/lib/layout/workspace-search.ts` + RBAC/plan-filtered Ctrl+K registry |
| CSV export | `src/lib/audit/csv-export.ts` — UTF-8 BOM, `;` delimiter, formula guards |
| Preload warning | `src/app/layout.tsx` — `preload: false` on Inter font |
| Tests | Extended `scripts/final-production-closeout.test.mjs` |

**Preserved:** Mollie sole billing, tenant isolation, RLS, RBAC, fail-closed vault, no live charging enablement.

---

## 4. Remaining operator actions

### P0 — before production promote

1. **Apply Supabase migration**  
   - **Where:** Supabase production → SQL migrations  
   - **What:** Run `20250824140000_public_api_service_role_grants.sql`  
   - **Why:** Admin diagnostics cannot probe API tables without `service_role` grants  
   - **Expected:** API readiness **≥ 84/100** (was 40); `publicApi.tableReachable=true`

2. **Configure Sentry**  
   - **Where:** Vercel production env  
   - **What:** Set `SENTRY_DSN` (server) — do not log or commit the value  
   - **Why:** Go-live monitoring check (required in production)  
   - **Expected:** Monitoring score **≥ 80/100** (with PostHog → **≥ 95**, `monitoringReady=Yes`)

3. **Configure PostHog**  
   - **Where:** Vercel production env  
   - **What:** Set `NEXT_PUBLIC_POSTHOG_KEY`  
   - **Why:** Product analytics monitoring check  
   - **Expected:** Monitoring **≥ 95/100** when combined with Sentry + health/status/headers

### P1 — optional provider credentials (do not block launch)

Configure OAuth client IDs/secrets per connector only when tenants need that integration (Google, Microsoft, Slack, Salesforce, etc.). Platform registers 13 OAuth-capable connectors without operator credentials.

### Explicitly not required for launch

- `MOLLIE_LIVE_CHARGING_ENABLED=true` (remain `false` until billing cutover)
- Predictive forecast generation (optional maturity)
- High compliance framework % (tenant operational maturity)
- Populating integration secrets vault (INTEGRATION_SECRET_KEY already configured)

---

## 5. Non-blocking maturity work

- Increase compliance framework readiness through policies, retention rules, audit activity
- Generate predictive forecasts after client operational data accumulates
- Configure optional OAuth providers per tenant demand
- Enterprise API keys / webhook endpoints (Enterprise plan feature)

---

## 6. Final expected diagnostics (after operator actions)

| Dimension | Before | After engineering + operator P0 |
|-----------|--------|----------------------------------|
| Production overall | 86 / Not Ready | **~92–95 / Pilot Ready** |
| Go-live score | 94 / Incomplete | **~98–100 / Incomplete→Ready*** |
| Monitoring | 60, ready=No | **≥ 95, ready=Yes** |
| OAuth | 82–80, ready=No | **90–100, ready=Yes** |
| API | 40 | **≥ 84** |
| Compliance | 77 | **~77** (tenant maturity) |
| Predictive | 65 | **~65** (optional) |
| Ctrl+K Compliance | no results | **returns Compliance** (owner/admin) |
| CSV in German Excel | single column | **multi-column** |
| Console preload | warning | **silenced** |

\*Go-live `complete=true` still requires `score ≥ 99` plus deployment/security/mail/operations booleans and abuse-protection completeness.

---

## 7. Regression verification

Run locally after deploy:

```bash
npm run lint
npm run typecheck
npm run test:production-readiness
npm run test:final-production-closeout
npm run test:enterprise-regression
npm run test:mollie-billing
npm run test:transactional-email
npm run test:definition-of-done
npm run test:enterprise-certification
npm run test:enterprise-release-approval
npm run test:enterprise-production-golive
npm run build
```

Manual smoke:

- Settings → Diagnostics: verify API, OAuth, monitoring scores
- Ctrl+K → “Compliance” (owner/admin) → `/dashboard/compliance`
- Compliance → Audit explorer → CSV export → open in German Excel
- Browser console: no Inter preload warning

---

## Readiness scoring map (Phase 1 reference)

### Production readiness (`computeProductionReadiness`)

15-dimension average: billing (Mollie), cron, queue, OAuth, connectors, API, compliance, AI, predictive, launch polish, pilot acquisition, deployment, pilot execution, go-live.

### Go-live readiness (`getGoLiveReadinessSnapshot`)

10 section averages: deployment, monitoring, security, billing, OAuth, staging, support, legal, operations, infrastructure (+ domain/mail scores displayed).

Boolean gates (`*Ready`) require section score **≥ 95** except `complete` which also needs overall **≥ 99** and abuse-protection completeness.
