# AURORANEXIS_GOD_MODE_SECURITY_ASSURANCE_REPORT

**Date:** 2026-09-03  
**Scope:** Owner-authorized white-hat assurance of Auroranexis-owned surfaces only. Non-destructive. No third-party attacks. No secrets printed.  
**Prior pass:** `eb5f9a2e` recorded baseline `ba231f79` then `resource_exhausted` — no phase evidence. This run completed remaining high-priority work.

## Baseline

| Item | Value |
|------|--------|
| Branch | `main` |
| Starting SHA | `ba231f79f0143a34c78f09e1a437a01154b28874` |
| origin/main at start | `ba231f79f0143a34c78f09e1a437a01154b28874` |
| Ending SHA | `ad75fc6` (local only; origin/main remains `ba231f79`) |
| Push | NONE |
| Deploy | NONE |

## VERDICT

**SECURITY_REMEDIATION_COMPLETED_READY_FOR_REVIEW**

Two P0 RLS self-update defects were proven in source. Remediating migrations are in-repo and **not applied to production**. Production remains exposed on those PostgREST paths until operators apply both migrations. One P2 open-redirect hardening is in application code (ships with the next deploy).

## Severity counts

| Severity | Count | Notes |
|----------|-------|--------|
| P0 | 2 | (1) `users_update_self` role / org self-mutation; (2) `client_portal_users_update_self_login` client/org retarget |
| P1 | 0 | — |
| P2 | 1 | Login / auth-callback `next` path accepted backslash / encoded `//` (code hardened) |
| P3 | 5 | CSP `unsafe-inline`; invoice counter RLS (now enabled); job catalog `USING (TRUE)`; white-label CSS breakout (admin); PDF logo fetch not passed through `validateOutboundUrl` (owner/admin + white-label only) |

## Confirmed vulnerabilities

1. **P0 — Privilege escalation / tenant escape via `users_update_self`.**  
   Foundation policy `USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid())` plus `GRANT UPDATE ON public.users TO authenticated` allows an authenticated workspace member to `PATCH` their own `users` row (role → `owner`, `organization_id` → another tenant, `is_disabled` → false) through PostgREST with the public anon key. Team owner/admin policies are OR-ed and do not block this self-update path. App profile actions only write `full_name`, but the database contract is broader.  
   **Fix:** `supabase/migrations/20260903160000_users_self_update_privilege_lock.sql` — self-update now requires `is_disabled = FALSE`, `organization_id = current_organization_id()`, `role = current_user_role()`. Owner/admin team policies unchanged.

2. **P0 — Portal tenant/client escape via `client_portal_users_update_self_login`.**  
   Policy `USING/WITH CHECK (auth_user_id = auth.uid() AND is_active = TRUE)` plus `GRANT UPDATE` lets a portal user `PATCH` `client_id` / `organization_id`. `current_portal_client_id()` / `current_portal_organization_id()` are SECURITY DEFINER readers of that row, so all portal SELECT policies (reports, incidents, risks, health, activity) would follow the new IDs. App login only writes `last_login_at`.  
   **Fix:** `supabase/migrations/20260903170000_portal_self_update_tenant_lock.sql` — WITH CHECK pins `organization_id` and `client_id` to current portal helpers.

3. **P2 — Open-redirect bypass in `resolveSafeRedirectPath`.**  
   Helper rejected `//host` but accepted `/\\host`, encoded `%2f%2f`, and `://`. Used by `signIn` (`redirect(path)`) and `/auth/callback`.  
   **Fix:** `src/lib/auth/safe-redirect.ts` — decode then reject `//`, `\`, `://`, `@`, and control characters.

## False positives / non-issues

| Observation | Why not a vuln |
|-------------|----------------|
| `job_definitions` / `job_schedules` `USING (TRUE)` | Global job catalog; no tenant secrets. Executions stay org-scoped for owner/admin. |
| Mollie webhook has no HMAC | Classic Mollie payment notifications; authenticity is `payments.get(id)` + org/customer ownership + idempotency. |
| `/api/health` `/api/ready` `/api/status` public | Boolean/config flags only; no secrets. Rate-limited on health. |
| `app.auroranexis.com/.env` HTTP 308 | Marketing host redirect; follow → 404 HTML, not env contents. |
| npm `browserslist` high | Build-toolchain OOM / untrusted stats file. Not reachable on production request path. No blind upgrade. |
| OpenAPI `/api/docs/openapi` public | Spec only; no credentials. |
| FastSpring/Paddle webhook routes | Return 410; no processing. |

## 21 category results

| # | Category | Result |
|---|----------|--------|
| 1 | Attack surface / route classification | **PASS** |
| 2 | Secret / information disclosure | **PASS** |
| 3 | Authentication / session | **PASS** |
| 4 | Password reset / open redirect | **PASS** (P2 remediating in code) |
| 5 | Authorization / IDOR / BOLA | **FAIL → REMEDIATED IN REPO** (P0 users + portal self-update; APIs org-scope from session/API key) |
| 6 | Supabase RLS | **FAIL → REMEDIATED IN REPO** (users lock + portal lock + counters RLS enable) |
| 7 | API security | **PASS** |
| 8 | Server Actions authorization | **PASS** |
| 9 | Injection | **PASS** |
| 10 | SSRF | **PASS WITH OBSERVATIONS** (integration HTTP gated; PDF logo fetch is admin-only P3) |
| 11 | XSS / CSP | **PASS WITH OBSERVATIONS** |
| 12 | CSRF | **PASS** |
| 13 | CORS | **PASS** |
| 14 | Webhooks (Mollie Auroranexis-side) | **PASS** |
| 15 | Cron / IndexNow | **PASS** |
| 16 | Cache isolation | **PASS** |
| 17 | Public file exposure | **PASS** |
| 18 | Error / debug leakage | **PASS** |
| 19 | Client portal isolation | **FAIL → REMEDIATED IN REPO** (P0 self-update client/org; queries still status+client scoped) |
| 20 | Dependencies (npm audit) | **PASS WITH OBSERVATIONS** |
| 21 | Logging / PII / security.txt | **PASS** |

---

## Matrix 1 — Route security

| Surface | Class | Auth | Evidence |
|---------|-------|------|----------|
| Marketing `www` pages, `/docs`, `/.well-known`, legal | PUBLIC | None | middleware public paths |
| `/login` `/signup` `/reset-password` `/auth/callback` | AUTH | Public forms; session exchange | `src/lib/auth/*` |
| Dashboard modules | AUTH + ROLE | Session + `requireModuleAccess` / permissions | `src/lib/rbac/route-guards.ts` |
| `/api/v1/*` (16 routes) | TENANT + SCOPE | Bearer API key via `withApiHandler` | `src/lib/api/middleware/handler.ts` |
| `/api/billing/sales-invoices/*/pdf` | TENANT + ROLE | Session + owner/admin + org-scoped invoice | pdf route |
| `/api/mollie/webhook` | WEBHOOK | Mollie re-fetch + idempotency | `webhooks.ts` |
| `/api/fastspring/*` | RETIRED | 410 | route.ts |
| `/api/cron/run` `/api/indexnow` `/api/operator/*` | CRON | Bearer `CRON_SECRET`, fail-closed in prod | live 401 |
| `/api/health` `/ready` `/status` | PUBLIC | Rate limit on health | boolean snapshot |
| `/client-portal/*` | PORTAL | Portal session; agency users redirected to dashboard | `session.ts` |
| `/api/docs` `/api/docs/openapi` | PUBLIC | Spec only | — |

No API route accepts client-supplied `organization_id` for tenancy. Creates use `ctx.organization.id` or `session.organization.id`.

## Matrix 2 — RLS

| Table set | RLS | Tenant condition | Notes |
|-----------|-----|------------------|-------|
| 105 / 106 `CREATE TABLE public.*` | ENABLED | `current_organization_id()` pattern | Inventory of all migrations |
| `users` self-update | ENABLED | **Was insufficient** | Locked in 20260903160000 |
| `client_portal_users` self-update | ENABLED | **Was insufficient** | Locked in 20260903170000 |
| `sales_invoice_number_counters` | **Was OFF** | N/A (service-role / SECURITY DEFINER) | RLS enabled, no authenticated policies |
| `job_definitions` / `job_schedules` | ENABLED | `USING (TRUE)` SELECT | Catalog only |
| `clients`, `reports`, `risks`, `incidents`, billing, portal | ENABLED | org (+ portal client) | Sampled policies |
| Disabled RLS | None found | — | No `DISABLE ROW LEVEL SECURITY` |

Admin/service-role clients are `server-only` (`src/lib/supabase/admin.ts`). No Client Component imports of admin/server.

## Matrix 3 — Role escalation

| From → To | Path | Result |
|-----------|------|--------|
| viewer/staff → owner via app team action | `updateTeamMemberRoleAction` + `canAssignRole` | Blocked |
| admin → owner via app | `canAssignRole` | Blocked |
| viewer/staff → owner via PostgREST self-update | `users_update_self` | **P0 until 20260903160000 applied** |
| portal → other client/org via PostgREST | `client_portal_users_update_self_login` | **P0 until 20260903170000 applied** |
| portal user → workspace | Portal login signs out if no `client_portal_users`; agency session sent to `/dashboard` | Isolated |
| readonly mutate | Permission + RLS write policies | Blocked at action layer |
| disabled user session | `is_disabled` nulls session | Pass; self-update lock also requires `is_disabled = FALSE` |
| invite accept | Seat + invitation token, not self-assign | Pass (source) |

Roles: owner / admin / staff / viewer (legacy mapped to Sprint 6 owner/admin/analyst/readonly).

## Matrix 4 — Data leak

| Probe | Result |
|-------|--------|
| `www` `/.env` `/.env.local` `/.git/HEAD` | 404 + CSP |
| `app` `/.env` `/.git/HEAD` | 308 → www 404 |
| `app/_next/static/chunks/app/page.js.map` | 403 |
| `public/` | Icons only; no env/git/maps |
| `.env.example` | Placeholder names only |
| `NEXT_PUBLIC_*` | URL, anon key, analytics/site keys — no Mollie/service-role |
| Hardcoded `sk_live_` / `whsec_` / `sb_secret_` in `src/` | None (pattern mentions only) |
| `/api/v1/clients` unauthenticated | `{"error":{"code":"unauthorized","message":"Invalid API key."}}` — no stack |
| Route error UI | Generic copy; digest to Sentry only |
| Health snapshot | Booleans + version + latency |
| security.txt | Contact + policy; **no bounty** |

## Matrix 5 — Attack class

| Class | Result | Evidence |
|-------|--------|----------|
| Auth | PASS | Session `getUser()`, disabled check, generic login errors, throttle |
| Authz / IDOR | FAIL→FIX | Resource queries `.eq(organization_id, session.org)`; P0 was users self-row |
| RLS | FAIL→FIX | Inventory + self-update lock |
| Injection | PASS | Supabase parameterized client; no raw SQL concatenation in app services |
| XSS | PASS WITH OBS | JSON-LD / layout inject structured data; CSS sanitized (blocks script/javascript); CSP has `unsafe-inline` |
| CSRF | PASS | Server Actions origin; no custom CORS; cookies via `@supabase/ssr` |
| SSRF | PASS WITH OBS | `validateOutboundUrl` on integration HTTP; PDF `fetchLogoBuffer` is owner/admin branding URL (P3) |
| CORS | PASS | No `Access-Control-Allow-Origin` on probed hosts |
| Secrets | PASS | Server-only env accessors; admin `server-only` |
| Caching | PASS | No `force-cache` / `unstable_cache` in `src/`; portal/session use request `cache()` |
| Webhooks | PASS | Re-fetch + ownership + idempotency; GET 405 |
| Server Actions | PASS | Sensitive actions `requireSession`; public: auth, portal login, contact capture (throttled) |
| Cron | PASS | Live 401 without Bearer; production fail-closed if secret missing |
| Deps | PASS WITH OBS | 0 critical, 1 high browserslist **NOT REACHABLE** (build) |
| Logging | PASS | Webhook logs payment id prefix only; no password/header dumps found |
| Public files | PASS | Curated probes 404/403 |
| Business logic | PASS WITH OBS | Entitlements from `resolveOrganizationEntitlements`; portal published-only reports |

---

## High-priority evidence notes

### 1. Tenant isolation / IDOR / RLS
- API v1: `authenticateApiRequest` binds org from hashed API key, not body.
- Client mutations: `.eq("id", …).eq("organization_id", session.organization.id)`.
- Invoice PDF: session org + issued invoice only.
- **P0** self-update as above.

### 2. Auth / session / password-reset / open-redirect
- Password reset: generic success, throttle, fixed `getPasswordResetRedirectUrl()` → `/reset-password`.
- Reset completion requires recovery session `getUser()`.
- Safe redirect hardened (P2).
- `is_disabled` users get no session.

### 3. Secrets
- Names only: `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `MOLLIE_API_KEY`, `INTEGRATION_SECRET_KEY`, `OPENAI_API_KEY`, SMTP password — all server-only in `.env.example`.
- No `NEXT_PUBLIC_MOLLIE_*`.
- Local untracked `.tmp-*` / `.recert-evidence` artifacts were **not** opened or committed.

### 4. Server Actions
- Domain action modules call `requireSession` (and role/plan guards where required).
- Intentionally public: `signIn` / `signUp` / password reset / portal login / marketing capture.
- Production job force-run from session is disabled (`jobs/actions.ts`).

### 5. Client portal
- Session joins `client_portal_users` + client + org; mismatch → null.
- Reports: `organization_id` + `client_id` + published statuses only.
- Agency users hitting portal login-required routes go to `/dashboard`.
- **P0** portal self-update client/org retarget locked in 20260903170000 (last_login_at still allowed).

### 6. Cron / IndexNow
- Live GET `/api/cron/run` and `/api/indexnow` → **401** `{"error":"Unauthorized."}`.
- `verifyCronAuthorization`: missing secret fails closed unless `NODE_ENV === "development"`; compare is timing-safe.

### 7. Cache
- Zero `force-cache` / `unstable_cache` in `src/`.
- Session helpers use React `cache()` (per-request, not CDN).

### 8. Webhooks
- Classic payment id → `client.payments.get` → metadata org + customer mismatch ignore + `ensureMollieIdempotency`.
- No payment transactions performed in this pass.

### 9–11. Files, headers, audit
- CSP + HSTS + COOP/CORP + nosniff live on www.
- security.txt live, no bounty language.
- npm: 1 high browserslist, **DEV/BUILD ONLY**, no upgrade performed.

---

## If I were an external researcher — next 10 paths

1. Confirm **both P0 migrations** not yet on prod, then retry PostgREST `users` and `client_portal_users` self-update.
2. Column-level updates on other self-writable rows (email / profile drift).
3. White-label `customCss` `</style>` breakout as a compromised admin (P3).
4. SSRF via integration webhook URLs that skip `validateOutboundUrl`.
5. Portal unpublished report access by ID (code currently status-filters).
6. API key scope confusion (`workspace` keys mapped to admin role).
7. Invite token reuse / seat bypass.
8. Mollie metadata org spoof if an attacker can create payments in the same Mollie account (provider-side; Auroranexis re-fetches).
9. Error paths that still interpolate `error.message` to JSON on some cron 500s (operator-only after auth).
10. Transitive frontend XSS via markdown/report HTML if a new renderer is added without sanitization.

---

## Validation

| Check | Result |
|-------|--------|
| `node --test` god-mode + users privilege-lock + signup-redirect | 39/39 PASS |
| Targeted typecheck / lint / build | PASS (`tsc --noEmit`; `next lint` exit 0 with pre-existing unused-var warnings; `next build` 226 pages) |
| Tests added | `scripts/god-mode-security-assurance.test.mjs` (includes portal lock); signup redirect assertions extended |

## Files changed (remediation)

- `supabase/migrations/20260903160000_users_self_update_privilege_lock.sql`
- `supabase/migrations/20260903170000_portal_self_update_tenant_lock.sql`
- `src/lib/auth/safe-redirect.ts`
- `scripts/god-mode-security-assurance.test.mjs`
- `scripts/users-self-update-privilege-lock.test.mjs`
- `scripts/signup-email-confirm-redirect.test.mjs`
- `docs/security/AURORANEXIS_GOD_MODE_SECURITY_ASSURANCE_REPORT.md`

## Operator action (not done here)

1. Apply `20260903160000_users_self_update_privilege_lock.sql` and `20260903170000_portal_self_update_tenant_lock.sql` to the production Supabase project.
2. Deploy the `safe-redirect` hardening with the next release.
3. Do **not** treat this report as production-cleared until both migrations are applied.

## Final statement

An **unauthenticated** external researcher cannot currently read tenant data, invoke cron/IndexNow, fetch `.env`/`.git`/source maps, or forge a Mollie reconcile without a real payment id in the Auroranexis Mollie account.

An **authenticated** low-privilege workspace member or portal user can currently escalate / retarget via PostgREST **until the two P0 migrations are applied**. After those migrations, those paths are closed. No push and no deploy were performed from this pass.
