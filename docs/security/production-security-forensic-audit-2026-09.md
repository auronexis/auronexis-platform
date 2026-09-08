# Auroranexis — Master Security Forensic Audit

| Field | Value |
|-------|-------|
| **Report ID** | `SEC-FORENSIC-2026-09-08` |
| **Date (UTC)** | 2026-09-08 |
| **Mode** | READ-ONLY / ZERO REMEDIATION |
| **Repository** | `D:\Projekt.01\Auroranexis` |
| **HEAD branch** | `main` |
| **HEAD commit** | `1334415577bcadbda9e2d59a02f4945ef6d1d96f` (`1334415` — *fix(seo): consolidate duplicate public hubs*, 2026-09-06) |
| **Auditor role** | Principal Application Security Engineer + Cloud Security Architect + SaaS Red Team Reviewer |
| **Remediation performed** | **NONE** |
| **Destructive / live privileged probes** | **NONE** (no production cron invoke, no webhook forge, no tenant creation, no secret rotation) |

**Prior context verified (not assumed):** Mollie is sole active billing provider; FastSpring/Paddle routes return 410; remediating migrations `20260903160000` / `20260903170000` exist in-repo (commit `4a01eba`); `safe-redirect.ts` hardened; cron uses Bearer `CRON_SECRET` fail-closed outside development; IndexNow gated to UTC 06:00–06:04 via `isIndexNowDailyCronWindow`.

---

## 0. EXECUTIVE VERDICT

### Exactly one verdict

# **HIGH-RISK EXPOSURE FOUND**

### Why

Application trust boundaries for session APIs, public API keys, cron Bearer auth, Mollie re-fetch reconciliation, entitlements, outbound URL controls, and open-redirect hardening are **largely sound in source**. However:

1. **Production application of P0 RLS privilege/tenant locks is UNVERIFIED.** Prior God Mode report (`docs/security/AURORANEXIS_GOD_MODE_SECURITY_ASSURANCE_REPORT.md`, 2026-09-03) documented that remediating migrations were **in-repo and not applied to production**. This audit confirms the lock migrations remain present and committed (`4a01eba`) but **cannot prove** live Supabase policy state. Until operators confirm both migrations on production, authenticated PostgREST self-update remains a **conditional CRITICAL** risk (privilege escalation + tenant escape).
2. Abuse controls that rely on **process-local in-memory rate limit maps** are weak on multi-instance serverless (auth + public API).
3. Several defense-in-depth observations (CSP `unsafe-inline`, PDF logo fetch without `validateOutboundUrl`, white-label CSS injection surface for admins) require hardening but are not proven unauthenticated remote compromise paths.

**Evidence of compromise (active breach):** **INCONCLUSIVE** — no live compromise indicators were investigated; this is a source/architecture forensic, not an IR engagement.

### Severity counts (this audit)

| Severity | Count | Notes |
|----------|------:|-------|
| CRITICAL | 0 open | FINDING-001 **CLOSED** production-verified 2026-09-08 |
| HIGH | 2 | Serverless-local rate limits; CRON_SECRET / operator blast radius if secret leaks |
| MEDIUM | 5 | Mollie classic webhook auth model; CSP unsafe-inline; PDF SSRF observation; status/health info; white-label CSS |
| LOW | 5 | Job catalog `USING (TRUE)`; npm toolchain advisories; OpenAPI public; demo e-invoice internal gate; API scope↔RBAC bridge unused |
| INFO / PASS observations | multiple | Documented non-issues |

### Top 5 risks

1. ~~**CRITICAL (conditional):** production RLS locks unverified~~ → **CLOSED 2026-09-08** (users lock already live; portal tenant lock applied & verified).
2. **HIGH:** In-memory rate limiting ineffective across Vercel isolates — credential stuffing / API cost abuse easier than limits imply.
3. **HIGH:** Compromise of `CRON_SECRET` unlocks `/api/cron/run` (force jobs), `/api/indexnow`, operator Mollie recovery (when live charging off), and connectivity probes.
4. **MEDIUM:** Mollie classic webhooks authenticate by payment id + API re-fetch (no HMAC) — correct for Mollie, but payment-id knowledge becomes a trigger oracle.
5. **MEDIUM:** CSP allows `'unsafe-inline'` scripts/styles — XSS impact amplified if any reflected/stored XSS is later introduced.

---

## 1. PRIMARY SECURITY QUESTION (20 capabilities)

**Question:** Can an unauthenticated or low-privilege actor, using only exposed surfaces, achieve any of the following against production tenants?

| # | Capability | Verdict | Evidence summary |
|---|------------|---------|------------------|
| 1 | Unauthenticated admin / cron execution | **NO (source)** | `verifyCronAuthorization` fail-closed when `CRON_SECRET` unset outside development (`src/lib/env.ts:75-87`; `src/app/api/cron/run/route.ts:18-20`) |
| 2 | Cross-tenant data read via API (Org A → Org B) | **NO (app layer)** | API key binds `ctx.organization.id`; client queries `.eq("organization_id", …)` (`src/lib/api/auth/validator.ts`; `src/lib/api/resources/clients.ts:131`) |
| 3 | Cross-tenant write / BOLA via resource UUID | **NO (app layer)** | Updates filter by org; missing/cross-tenant → not found |
| 4 | Privilege escalation via Server Action role field | **NO** | `canAssignRole` blocks viewer/staff → owner; admin limited (`src/lib/team/guards.ts:62-68`) |
| 5 | Privilege escalation via PostgREST `users` self-update | **NO (prod verified)** | Live `users_update_self` WITH CHECK pins org + role (2026-09-08) |
| 6 | Portal tenant/client retarget via PostgREST | **NO (prod verified)** | Portal self-update lock applied live 2026-09-08 from `20260903170000` |
| 7 | Client-supplied plan grants entitlements | **NO** | `resolveOrganizationEntitlements` from subscription rows; return-state explicitly non-granting (`src/lib/entitlements/resolver.ts`; `return-state.ts` comment) |
| 8 | Forge Mollie webhook to grant paid plan without payment | **UNLIKELY** | Re-fetch Payment from Mollie API; ownership checks; idempotency (`webhooks.ts`) |
| 9 | Steal `SUPABASE_SERVICE_ROLE_KEY` / Mollie key from client bundle | **NO** | `server-only` admin; no `NEXT_PUBLIC_MOLLIE`; secrets not in `src` literals |
| 10 | Open redirect after login / auth callback | **NO (code)** | `resolveSafeRedirectPath` rejects `//`, `\`, `://`, `@` (`safe-redirect.ts:17-27`) |
| 11 | SSRF to cloud metadata via integration HTTP | **NO** | `assertSafeOutboundUrl` blocks private/metadata (`outbound-url.ts`) |
| 12 | SSRF via report PDF logo URL | **PARTIAL / LOW** | `fetchLogoBuffer` does not use validator (`reports/pdf.ts:162-183`); requires owner/admin branding URL |
| 13 | CSRF mutate session actions from evil site | **MITIGATED** | Next.js Server Actions + same-site cookies; no CORS wildcards found |
| 14 | Exfiltrate all tenants via service role from browser | **NO** | Admin client not importable from Client Components (`server-only`) |
| 15 | Unauthenticated job force-run / billing recovery | **NO (source)** | Operator recovery requires Bearer cron secret (`paid-purchase-recovery/route.ts:65-67`) |
| 16 | IndexNow / SEO abuse without secret | **NO** | Bearer `CRON_SECRET`; daily window for cron path (`indexnow.ts:53-55`) |
| 17 | Scanner junk paths rewrite to privileged app | **NO** | Middleware hard-404 unknown public dynamic slugs (`middleware.ts:61-63`; allowlist) |
| 18 | Read secrets from `/api/health`/`status` | **NO** | Booleans + version + latency only (`observability/health.ts`) |
| 19 | Dependency RCE on production request path (npm audit) | **NO proven** | `browserslist` high / `fflate` moderate — toolchain/build; not shown on request path |
| 20 | Silent Stripe/FastSpring reactivation | **NO** | FastSpring webhook/connectivity 410; Mollie sole provider |

**Direct answer:** Unauthenticated remote takeover of arbitrary tenants is **not evidenced** in application code. The dominant unresolved production risk is **whether P0 RLS locks are live**; until confirmed, treat authenticated low-privilege PostgREST escalation as **HIGH-RISK / conditionally CRITICAL**.

---

## 2. ATTACK-SURFACE INVENTORY (FIRST)

### 2.1 API routes (`src/app/api/**/route.ts`)

**Count:** **35 unique** `route.ts` handlers (Windows path-separator duplicates collapsed). Complete line-level inventory pass: [Inventory API route auth](49bb5e51-45dc-4a80-b845-829187666b6f). Methods below re-verified against exports under `src/app/api/v1/**`.

| PATH | METHOD | AUTH? | ROLE? | TENANT SCOPED? | INPUT | PRIVILEGED CLIENT? | RATE LIMITED? | SECURITY-SENSITIVE? | NOTES |
|------|--------|-------|-------|----------------|-------|--------------------|---------------|---------------------|-------|
| `/api/cron/run` | GET, POST | Bearer `CRON_SECRET` | N/A (secret) | Platform | Query `job`, `probe` | Jobs use admin | No (secret-gated) | **YES** | Fail-closed prod; probe lists job IDs; force job; IndexNow in-window (`cron/run/route.ts`) |
| `/api/indexnow` | GET, POST | Bearer `CRON_SECRET` | N/A | Platform | None | Outbound IndexNow | No | YES | Ops manual; also via cron window (`indexnow/route.ts`) |
| `/api/mollie/webhook` | POST | Mollie classic (id + re-fetch) | N/A | Via payment metadata + ownership | Body payment id | **Yes** admin | Idempotency ledger | **YES** | No HMAC by design (`mollie/webhook/route.ts`) |
| `/api/mollie/connectivity` | GET | Cron **or** session | `settings.write` | Probe only | — | Mollie API | No | YES | Sanitized probe (`mollie/connectivity/route.ts`) |
| `/api/fastspring/webhook` | POST, GET | N/A | — | — | — | No | — | Retired | **410** (`fastspring/webhook/route.ts`) |
| `/api/fastspring/connectivity` | GET | N/A | — | — | — | No | — | Retired | **410** |
| `/api/operator/mollie/paid-purchase-recovery` | POST | Bearer `CRON_SECRET` only | Ops | Body `organizationId` | JSON | **Yes** | No | **YES** | Blocked when live charging enabled (`paid-purchase-recovery/route.ts:70-75`) |
| `/api/operator/sales-invoice/preview` | GET | Cron **or** session | `settings.write` | Preview only | Query plan/scenario/format | No DB write | No | MED | In-memory PDF/HTML |
| `/api/billing/sales-invoices/[invoiceId]/pdf` | GET | Session | `settings.write` | **Yes** session org | Path id | Org-scoped load | No | YES | Cross-tenant → 404 (`pdf/route.ts:33-46`) |
| `/api/billing/sales-invoices/[invoiceId]/einvoice` | GET | Session | `settings.write` | **Yes** | Path id | Org-scoped | No | YES | Companion export |
| `/api/health` | GET | None | — | — | — | DB health check | **Yes** 120/min/IP | LOW | Booleans only |
| `/api/ready` | GET | None | — | — | — | Health subset | **No** | LOW | Ready flags — no RL |
| `/api/status` | GET | None | — | — | — | Health snapshot | **No** | LOW | Same snapshot as health — no RL |
| `/api/docs` | GET | Optional session for HTML | — | — | — | No | No | LOW | Public docs |
| `/api/docs/openapi` | GET | None | — | — | — | No | Cache 300s | LOW | Spec only |
| `/api/v1/me` | GET | API key | **No scopes required** | Key org | — | Admin for key lookup | Plan RPM | YES | `me/route.ts:6-9` |
| `/api/v1/clients` | GET, POST | API key | `clients.read` / `clients.write` | Key org | Query/body | Admin insert w/ org id | Plan RPM | YES | |
| `/api/v1/clients/[id]` | GET, PATCH, DELETE | API key | `clients.read` / `clients.write` | Key org + id | Path/body | Admin + org eq | Plan RPM | YES | |
| `/api/v1/clients/[id]/incidents` | GET | API key | `incidents.read` | Key org | Path | Tenant | Plan RPM | YES | |
| `/api/v1/clients/[id]/risks` | GET | API key | `risks.read` | Key org | Path | Tenant | Plan RPM | YES | |
| `/api/v1/clients/[id]/health` | GET | API key | `health.read` | Key org | Path | Tenant | Plan RPM | YES | |
| `/api/v1/incidents` | GET | API key | `incidents.read` | Key org | Query | Tenant | Plan RPM | YES | Read-only collection |
| `/api/v1/incidents/[id]` | GET | API key | `incidents.read` | Key org | Path | Tenant | Plan RPM | YES | |
| `/api/v1/risks` | GET | API key | `risks.read` | Key org | Query | Tenant | Plan RPM | YES | Read-only collection |
| `/api/v1/risks/[id]` | GET | API key | `risks.read` | Key org | Path | Tenant | Plan RPM | YES | |
| `/api/v1/reports` | GET | API key | `reports.read` | Key org | Query | Tenant | Plan RPM | YES | Read-only collection |
| `/api/v1/reports/[id]` | GET | API key | `reports.read` | Key org | Path | Tenant | Plan RPM | YES | |
| `/api/v1/activity` | GET | API key | `activity.read` | Key org | Query limit | Tenant | Plan RPM | YES | |
| `/api/v1/automation` | GET | API key | `automation.read` | Key org | Query | Tenant | Plan RPM | YES | |
| `/api/v1/automation/[id]` | GET | API key | `automation.read` | Key org | Path | Tenant | Plan RPM | YES | |
| `/api/v1/integrations` | GET | API key | `integrations.read` | Key org | — | Tenant | Plan RPM | YES | |
| `/api/v1/predictive` | GET | API key | `predictive.read` + plan feature | Key org | — | Tenant | Plan RPM | YES | |
| `/api/v1/ai` | POST | API key | `ai.execute` | Key org | Body module/prompt | Usage by org | Plan RPM | YES | Echo/usage; no arbitrary provider RCE evidenced |
| `/api/connectors/oauth/[connectorId]/authorize` | GET | Session | plan + `settings.write` | Session org | Path | OAuth state + PKCE | No | YES | Fixed redirect URI |
| `/api/connectors/oauth/[connectorId]/callback` | GET | Session + OAuth state | plan + `settings.write` | State org == session org | code/state | Token store | No | YES | PKCE/state consume (`callback/route.ts:57-66`) |

**Cross-cutting (inventory pass):**

- Middleware **excludes** `/api/*` from session refresh; every sensitive route self-authenticates.
- `vercel.json` applies CSP/security headers globally (including API).
- Public API auth is **key hash + scopes + plan feature + org binding** (`validator.ts` / `handler.ts`); `assertScopeMatchesRbac` exists (`api/auth/context.ts:100-109`) but **`withApiHandler` does not invoke it** — authorization is scope-based (FINDING-011).
- Workspace API keys map synthetic role `"admin"` (`validator.ts:66`); personal keys use creator role — still gated by key scopes.
- No `route.ts` imports `createAdminClient` directly; privileged access lives in auth/resources/libs.
- Highest privilege ops surfaces: `/api/cron/run`, `/api/operator/mollie/paid-purchase-recovery`, `/api/mollie/webhook`.

### 2.2 Other surfaces

| Surface | Auth | Notes |
|---------|------|-------|
| Server Actions (`"use server"` across `src/lib/**`) | `requireSession` / permission guards (sampled auth, team, billing, portal) | Mutations; CSRF relies on Next Action protocol + cookies |
| `/auth/callback` | OAuth/PKCE code exchange | Safe redirect (`auth/callback/route.ts`) |
| `/login` `/signup` `/reset-password` | Public + throttles | `login-throttle.ts` |
| Dashboard App Router | Session + module/RBAC | `requireSession` / route guards |
| `/client-portal/*` | Portal session | Separate `client_portal_users`; RLS helpers |
| `/internal/einvoice-preview*` | Dev gate `isEInvoiceViewerPreviewAllowed` | Demo XML only; `notFound()` when disallowed |
| Supabase PostgREST (anon + JWT) | RLS | **Critical trust boundary** for self-update policies |
| Supabase RPC / SECURITY DEFINER | `current_organization_id`, `current_user_role`, portal helpers, invoice allocator | `SET search_path = public` on sampled helpers |
| Vercel Cron | Calls `/api/cron/run` with secret | `vercel.json` `*/5 * * * *` |
| Marketing dynamic `[slug]` | Public allowlist | Hard 404 unknown (`public-dynamic-slug-allowlist.ts`) |

---

## 3. AUTHENTICATION AUDIT

| Control | Status | Evidence |
|---------|--------|----------|
| Session via Supabase SSR cookies + `getUser()` | **PASS** | `src/lib/auth/session.ts:21-28` — uses `getUser()`, not trust-only `getSession()` JWT claim |
| Disabled users blocked | **PASS** | `appUser.is_disabled` → null session (`session.ts:38-40`) |
| Login throttle | **PASS WITH OBSERVATIONS** | 10 / 15 min per email (`login-throttle.ts:22-34`); **in-memory** only |
| Signup throttle | **PASS WITH OBSERVATIONS** | 5 / hour (`:37-50`) |
| Password reset throttle | **PASS WITH OBSERVATIONS** | 30s cooldown + 5/hour (`:56-84`) |
| E2E rate-limit bypass | **PASS** | Forced off when `NODE_ENV === "production"` (`e2e-bypass.ts:6-8`) |
| API keys | **PASS** | Format check, hash lookup, constant-time compare, expiry (`api/auth/validator.ts`) |
| Auth callback | **PASS** | Code exchange + safe `next` (`auth/callback/route.ts`) |
| Open redirect | **PASS** | `safe-redirect.ts` |

**Domain verdict: PASS WITH OBSERVATIONS** (rate-limit durability).

---

## 4. AUTHORIZATION / RBAC

**Stored roles:** `owner` \| `admin` \| `staff` \| `viewer` (`foundation.sql` CHECK; `rbac/permissions.ts`).

**Authorization layer mapping:** `staff→analyst`, `viewer→readonly`; Sprint 6 also defines `manager`/`member` in permission types (`authorization/permissions.ts:4-14`, `LEGACY_USER_ROLE_MAP`).

| Check | Result |
|-------|--------|
| Module matrix owner/admin/staff/viewer | Present (`rbac/permissions.ts`) |
| Team role assignment | Owner can assign non-conflicting; admin only staff/viewer (`team/guards.ts`) |
| Settings / profitability | Restricted to elevated roles |
| Portal manage users | owner/admin (`client-portal/guards.ts`) |

**Domain verdict: PASS** (app layer). Residual risk is PostgREST self-update if RLS unlock not live.

---

## 5. MULTI-TENANCY (HIGHEST PRIORITY)

### App / API layer

- Session org from `users.organization_id` via authenticated profile (`session.ts:42-48`).
- Public API org from API key row (`validator.ts:48-58`); creates use `ctx.organization.id` (`clients.ts:61`).
- Invoice PDF uses `session.organization.id` + invoice id; cross-tenant masked as 404 (`pdf/route.ts:33-46`).
- OAuth callback requires `stateRecord.organizationId === session.organization.id` (`callback/route.ts:63-66`).

**No route sampled accepts client-supplied `organizationId` as the tenancy source of truth for normal customer APIs.** Operator recovery intentionally takes `organizationId` but is gated by `CRON_SECRET`.

### Database layer

- Tenant pattern: `organization_id = public.current_organization_id()` across modules.
- **P0 history:** weak `users_update_self` / portal self-update (see §6).

**Tenant-isolation verdict:** **PASS (application)** / **PASS (production RLS locks verified live 2026-09-08)** — migration history for `20260903160000` / `20260903170000` reconciled 2026-09-08 (`migration repair --status applied`; SQL not re-executed).

---

## 6. SUPABASE / RLS FORENSIC

| Item | Finding |
|------|---------|
| `DISABLE ROW LEVEL SECURITY` | **None** in migrations (grep) |
| `USING (TRUE)` | `job_definitions` / `job_schedules` SELECT only (`20250624140000_production_infrastructure.sql:92-97`) — catalog, not tenant secrets |
| SECURITY DEFINER | `current_app_user_id`, `current_organization_id`, `current_user_role`, portal helpers, invoice number allocator — sampled with `SET search_path = public` |
| service_role grants | Widespread for workers/admin — expected; client must never receive service key |
| `users_update_self` lock | `supabase/migrations/20260903160000_users_self_update_privilege_lock.sql` — WITH CHECK pins org + role + not disabled |
| Portal self-update lock | `20260903170000_portal_self_update_tenant_lock.sql` — pins org + client_id |
| Invoice counters | RLS enabled, no authenticated policies (defense in depth) |
| Admin client | `server-only`; PostgREST uses `apikey` without Bearer secret JWT mistake (`admin.ts:19-50`) |

**Known prior P0 relevance:** **CLOSED in production** (users lock already live; portal lock applied 2026-09-08). Source remediation exists (`4a01eba`). Migration history still misaligned.

**Domain verdict: PASS (live policies)** — bookkeeping of `schema_migrations` remains a separate ops item.

---

## 7. EVERY API ROUTE — SUMMARY JUDGMENT

See inventory §2.1 (35 routes). Classification:

- **Authenticated tenant APIs (`/api/v1/*`):** PASS pattern (key + scope + org). Most collections are **GET-only**; writes concentrated on `clients` (+ `ai` POST).
- **`/api/v1/me`:** Valid key required; **no scopes** — returns identity for that key’s org only.
- **Billing PDF/e-invoice:** PASS tenant + `settings.write`.
- **Webhooks:** Mollie active; FastSpring gone (410).
- **Cron/operator/indexnow:** Secret Bearer (connectivity/preview also allow admin session).
- **Public health/docs:** Intentional; `/ready` and `/status` lack the health IP rate limit.
- **Weakest unauthenticated:** Mollie webhook (by provider design) + health/status recon (LOW–MED).

**Domain verdict: PASS WITH OBSERVATIONS.**

---

## 8. CRON SECURITY — DEDICATED VERDICT

### Verdict: **SECURE** (source / design)

| Control | Evidence |
|---------|----------|
| Auth required before work | `cron/run/route.ts:18-20` |
| Fail-closed outside development if secret missing | `env.ts:76-79` |
| Timing-safe compare | `env.ts:16-24`, `86` |
| Methods GET+POST both gated | Same `handleCron` |
| Probe without execution | `probe=1` still requires auth (`:23-28`) |
| IndexNow window | `isIndexNowDailyCronWindow` hours=6 minutes&lt;5 (`indexnow.ts:53-55`) |
| Vercel schedule | `*/5 * * * *` → `/api/cron/run` (`vercel.json`) |

**Not invoked against production in this audit.** Live secret strength / rotation **UNVERIFIED** (ops).

**Residual HIGH:** secret exfiltration ⇒ platform job + operator surfaces (§ findings).

---

## 9. WEBHOOKS (MOLLIE)

| Control | Status | Evidence |
|---------|--------|----------|
| Classic payment id extract | Present | `mollie/webhook/route.ts:45-50` |
| Authoritative re-fetch | Present | `payments.get` in reconcile paths (`webhooks.ts`) |
| Idempotency + payload hash | Present | `ensureMollieIdempotency` (`webhooks.ts:71-185`) |
| Customer ownership mismatch reject | Present | test path `:606-618`; production path analogous |
| Live charging kill switch | Present | webhook 503 if live creds but charging disabled (`webhook/route.ts:34-39`) |
| HMAC signature | **N/A (Mollie classic)** | Documented non-issue if re-fetch holds |
| Legacy FastSpring | 410 | No processing |

**Domain verdict: PASS WITH OBSERVATIONS** (payment-id oracle; ensure Mollie dashboard URL secrecy).

---

## 10. BILLING / ENTITLEMENTS

| Risk | Result |
|------|--------|
| Client-supplied plan activates access | **Blocked** — entitlements from subscription / overrides server-side (`entitlements/resolver.ts`) |
| Checkout return query grants plan | **Blocked** — informational only (`return-state.ts` documented) |
| Mollie sole provider | **Confirmed** — FastSpring routes 410; Mollie env server-only |
| Operator recovery while live charging | **Blocked** (`paid-purchase-recovery/route.ts:70-75`) |

**Domain verdict: PASS.**

---

## 11. SSRF

| Path | Status |
|------|--------|
| Integration HTTP client | **PASS** — `assertSafeOutboundUrl` (`http-client.ts:93`) |
| Outbound URL library | Blocks localhost, RFC1918, link-local, metadata hosts, non-HTTPS in prod (`outbound-url.ts`) |
| Report PDF logo fetch | **OBSERVATION** — raw `fetch(logoUrl)` (`reports/pdf.ts:168`) |
| IndexNow / Mollie / VIES | Fixed vendor endpoints |

**Domain verdict: PASS WITH OBSERVATIONS.**

---

## 12. INJECTION / XSS

| Class | Status |
|-------|--------|
| SQL | Parameterized Supabase client; no raw string SQL in app paths sampled |
| XSS React | Default escaping; limited `dangerouslySetInnerHTML` for JSON-LD, CSP-managed layout, white-label CSS |
| White-label CSS | Sanitizer blocks `@import`, `expression(`, `javascript:` (`white-label/validation.ts:1-28`) — not a full CSS parser; admin/owner only |
| SVG uploads | `sanitizeSvgBytes` referenced in white-label assets |

**Domain verdict: PASS WITH OBSERVATIONS.**

---

## 13. CSRF / MUTATIONS

- Server Actions + cookie sessions; no `Access-Control-Allow-Origin` wildcards found in `src`.
- State-changing APIs expect Bearer API keys (not cookie) for `/api/v1`, reducing classic CSRF.
- Mollie webhook is intentionally unauthenticated (provider callback) with re-fetch authenticity.

**Domain verdict: PASS.**

---

## 14. CORS

No application CORS allow-all configuration found (`Access-Control-Allow-Origin` grep empty in `src`). Browser cross-origin credentialed API abuse not evidenced.

**Domain verdict: PASS.**

---

## 15. RATE LIMIT / COST ABUSE

| Limit | Implementation | Gap |
|-------|----------------|-----|
| Login/signup/reset/forms | In-memory map (`security/rate-limit.ts`) | Resets per isolate; no shared Redis |
| Public API | Per API key in-memory (`api/rate-limit/limits.ts`) | Same |
| Health | 120/min/IP in-memory | Same |
| AI executive | Separate in-memory wrappers | Same |
| Cron | Secret only | N/A |

**Domain verdict: FAIL (durability) / PASS (intent)** → recorded as **HIGH** finding for multi-instance abuse resistance.

---

## 16. SECRETS INVENTORY (NO VALUES)

| Secret / type | Location | Tracked in git? | Client risk |
|---------------|----------|-----------------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Server env | `.env*` gitignored; `.env.example` only | Must stay server-only — **PASS** pattern |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public by design | example only | RLS-dependent |
| `CRON_SECRET` | Server env | Not in src literals | High blast radius if leaked |
| `MOLLIE_API_KEY` | Server env | No `NEXT_PUBLIC_MOLLIE` (tests assert) | Server-only |
| `RESEND_API_KEY` / email providers | Server | — | Server-only |
| `INDEXNOW_KEY` | Server | — | Used in IndexNow POST body to Bing — not `NEXT_PUBLIC` |
| `OPENAI` / AI keys | Server resolve | — | Server-only |
| Hardcoded live keys in `src/` | — | **None found** (pattern search) | — |

**Domain verdict: PASS** (source). Live vault/rotation discipline **UNVERIFIED**.

---

## 17. LOGGING DISCLOSURE

- Mollie logs use id **prefixes**, not full secrets (`webhook/route.ts:96-99`).
- API handler returns generic 500 message (`handler.ts:93-95`).
- Executive intelligence redacts Bearer tokens (`redaction.ts`).
- Integration HTTP sanitizes auth headers for logs (`http-client.ts:62-71`).

**Domain verdict: PASS WITH OBSERVATIONS** (ensure production log drains retain redaction).

---

## 18. SECURITY HEADERS

Applied via `vercel.json` + `getSecurityHeaders` / middleware `applySecurityHeaders`:

- CSP (with `'unsafe-inline'` script/style)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- Referrer-Policy, Permissions-Policy
- COOP / CORP
- HSTS in production middleware path

**Domain verdict: PASS WITH OBSERVATIONS** (CSP inline).

---

## 19. OPEN REDIRECT / HOST HEADER

| Control | Status |
|---------|--------|
| `resolveSafeRedirectPath` | **PASS** |
| Apex→www / app marketing→www | Controlled builders (`middleware-routing`) |
| Auth callback uses `getAppUrl()` origin | **PASS** |

Host-header cache poisoning against Next on Vercel: **UNVERIFIED** (platform); no custom Host-based trust for security decisions beyond marketing redirects.

**Domain verdict: PASS.**

---

## 20. FILES / UPLOADS / EXPORTS

| Surface | Notes |
|---------|-------|
| White-label assets | MIME checks + SVG sanitize |
| Sales invoice PDF/e-invoice | Auth + org scope |
| Report PDF export | Auth module paths; logo fetch observation |
| Audit CSV | Server-side, role gated (module) |
| Internal e-invoice demo download | Dev-gated demo bytes only |

**Domain verdict: PASS WITH OBSERVATIONS.**

---

## 21. CLIENT PORTAL

| Control | Status |
|---------|--------|
| Separate portal user table + helpers | Present |
| Self-update tenant lock migration | In-repo; prod apply **UNVERIFIED** |
| Portal SELECT policies client-scoped | Present in portal migrations |
| Manage portal users | owner/admin only |

**Domain verdict: UNVERIFIED / conditional FAIL** pending migration confirmation (same P0 family).

---

## 22. ADMIN / DIAGNOSTIC ROUTES

| Route | Gate |
|-------|------|
| `/api/operator/*` | `CRON_SECRET` (recovery) or cron/session for invoice preview |
| `/api/mollie/connectivity` | Cron or owner/admin |
| `/internal/einvoice-preview` | Non-production allow helper |
| Platform diagnostics libs | Server-only; not all exposed as public HTTP |

**Domain verdict: PASS** (source). Protect `CRON_SECRET` as production admin equivalent.

---

## 23. npm audit (SAFE READ-ONLY)

Executed: `npm audit` / `npm audit --omit=dev` (no upgrades).

| Advisory | Severity | Package | Production request-path risk |
|----------|----------|---------|------------------------------|
| GHSA-c83g-rgw3-j3cx / GHSA-73wf-gq98-2v4g | high | `browserslist` | **Toolchain / build** — not evidenced on interactive request path |
| GHSA-px8p-9vwx-vf98 | moderate | `fflate` | ZIP parsing — assess if user-upload unzip uses vulnerable path (**UNVERIFIED** wiring) |

**Domain verdict: PASS WITH OBSERVATIONS** — track upgrades in controlled change window; do not blind-upgrade in this audit.

---

## 24. NEXT.JS APP ROUTER (INSTALLED)

| Item | Value |
|------|-------|
| Declared / locked | `next@15.5.23` (`package-lock.json`) |
| Router | App Router (`src/app`) |
| Middleware | Session update for non-API; API self-auth |
| Server Actions | Widespread `"use server"` |
| `server-only` admin | Enforced pattern |

Known App Router considerations reviewed against this codebase:

- Prefer `auth.getUser()` for gating — **done**.
- Do not expose Server Action internals — standard.
- Middleware matcher skips `api/` — intentional; routes must self-protect — **they do** for sensitive paths sampled.

**Domain verdict: PASS.**

---

## 25. INTERNET SCANNER / JOOMLA-STYLE PROBES

Middleware returns **hard HTTP 404 HTML** for unknown public dynamic slugs under `/features|solutions|templates|use-cases|industries|docs/` (`middleware.ts:25-35, 61-63`). Does **not** rewrite junk paths into dashboard/API.

API unknown paths: Next default 404 (not remapped to privileged handlers).

**Live production probe of scanner URLs:** not executed in this read-only pass (optional safe GETs to public marketing only were out of scope per “minimal autonomy”). Source control is **PASS**.

**Domain verdict: PASS (source).**

---

## 26. OWASP TOP 10 MAPPING (2021)

| OWASP | Mapping | Audit result |
|-------|---------|--------------|
| A01 Broken Access Control | RBAC + RLS + tenant filters; P0 self-update residual | **CONDITIONAL FAIL** |
| A02 Cryptographic Failures | HTTPS/HSTS; secrets server-side | PASS |
| A03 Injection | Parameterized DB; CSS sanitizer partial | PASS w/ obs |
| A04 Insecure Design | Entitlements not client-trusting; Mollie re-fetch | PASS |
| A05 Security Misconfiguration | Headers present; CSP inline; health public | PASS w/ obs |
| A06 Vulnerable Components | npm audit toolchain highs | PASS w/ obs |
| A07 Auth Failures | Throttles present but local-memory | PASS w/ obs |
| A08 Software/Data Integrity | Webhook idempotency; no client entitlement grant | PASS |
| A09 Logging/Monitoring Failures | Redaction patterns; completeness UNVERIFIED | UNVERIFIED ops |
| A10 SSRF | Outbound allowlist; PDF logo gap | PASS w/ obs |

---

## 27. FINDINGS (FALSE-POSITIVE CONTROLLED)

### FINDING-001 — CLOSED — PRODUCTION VERIFIED (2026-09-08)

| Field | Content |
|-------|---------|
| **ID** | FINDING-001 |
| **Severity** | Was CRITICAL (conditional) — **CLOSED** after live production verification |
| **CWE** | CWE-863 / CWE-639 |
| **Files** | `supabase/migrations/20250623000000_foundation.sql:94-99` (historical weak); `20260903160000_users_self_update_privilege_lock.sql`; `20260903170000_portal_self_update_tenant_lock.sql` |
| **Route** | Supabase PostgREST `PATCH /rest/v1/users` / `client_portal_users` (not Next route) |
| **Status** | **CLOSED — PRODUCTION VERIFIED** (project `auroranexis-prod` / `norrzshzshmvbrmpmhjb`) |
| **Users lock** | Already LIVE before this remediation (WITH CHECK pins `organization_id` + `role` + `is_disabled=false`). Not modified. |
| **Portal lock** | Was MISSING (WITH CHECK only `auth_user_id` + `is_active`). Applied 2026-09-08 via SQL from `20260903170000_portal_self_update_tenant_lock.sql` only (no `db push`). |
| **Post-remediation portal WITH CHECK (live)** | `auth_user_id = auth.uid() AND is_active = true AND organization_id = current_portal_organization_id() AND client_id = current_portal_client_id()` |
| **Competing portal UPDATE** | `client_portal_users_update_agency` remains owner/admin-only — not a portal-user bypass |
| **Users regression** | `users_update_self` unchanged and still locked after portal remediation |
| **Mutation test** | NOT PERFORMED — SAFETY CONSTRAINT (no disposable portal identity) |
| **Migration history** | Neither `20260903160000` nor `20260903170000` recorded in `schema_migrations` — **bookkeeping still outstanding** (separate from enforcement) |
| **Confidence** | HIGH (live `pg_policies` re-read after mutation) |

### FINDING-002 — HIGH

| Field | Content |
|-------|---------|
| **ID** | FINDING-002 |
| **Severity** | HIGH |
| **CWE** | CWE-770 |
| **Files** | `src/lib/security/rate-limit.ts`; `src/lib/security/login-throttle.ts`; `src/lib/api/rate-limit/limits.ts` |
| **Prerequisite** | Attacker distributes requests across instances / cold starts |
| **Trust boundary** | Edge/serverless process memory ≠ global enforcement |
| **Scenario** | Credential stuffing / API hammering exceeds intended caps |
| **Impact** | Account takeover attempts, AI/API cost amplification |
| **Mitigation** | Shared store (Upstash/Redis/Vercel KV) or edge WAF rate rules |
| **Confidence** | HIGH |

### FINDING-003 — HIGH

| Field | Content |
|-------|---------|
| **ID** | FINDING-003 |
| **Severity** | HIGH |
| **CWE** | CWE-250 / CWE-732 |
| **Files** | `src/lib/env.ts:68-87`; `src/app/api/cron/run/route.ts`; `src/app/api/operator/mollie/paid-purchase-recovery/route.ts` |
| **Prerequisite** | `CRON_SECRET` disclosure (logs, CI, env leak) |
| **Scenario** | Attacker force-runs jobs, IndexNow, or (if live charging off) billing recovery |
| **Impact** | Platform integrity / billing repair abuse |
| **Mitigation** | Rotate secret; separate operator secret; IP allowlist; remove probe job listing if unused |
| **Confidence** | HIGH (blast radius); exploit requires secret |

### FINDING-004 — MEDIUM

| Field | Content |
|-------|---------|
| **ID** | FINDING-004 |
| **Severity** | MEDIUM |
| **CWE** | CWE-345 |
| **Files** | `src/app/api/mollie/webhook/route.ts`; `src/lib/billing/providers/mollie/webhooks.ts` |
| **Prerequisite** | Knowledge of valid Mollie `tr_` payment id |
| **Scenario** | Replay/trigger reconcile; authenticity still requires Mollie API paid state + ownership |
| **Impact** | Trigger processing / noise; entitlement grant only if Mollie reports paid for that org’s payment |
| **Mitigation** | Keep payment ids confidential; monitor idempotency failures; consider Mollie Next-gen signed webhooks when available |
| **Confidence** | HIGH (design); exploit to false-pay **LOW** if Mollie API authoritative |

### FINDING-005 — MEDIUM

| Field | Content |
|-------|---------|
| **ID** | FINDING-005 |
| **Severity** | MEDIUM |
| **CWE** | CWE-1021 / CWE-79 |
| **Files** | `src/lib/security/csp.ts:17-27`; `vercel.json` headers |
| **Scenario** | Any future XSS executes inline script under CSP |
| **Impact** | Session theft / account actions |
| **Mitigation** | Nonces/hashes; remove `'unsafe-inline'` for scripts |
| **Confidence** | HIGH |

### FINDING-006 — MEDIUM

| Field | Content |
|-------|---------|
| **ID** | FINDING-006 |
| **Severity** | MEDIUM (admin-triggered) |
| **CWE** | CWE-918 |
| **Files** | `src/lib/reports/pdf.ts:162-183` |
| **Prerequisite** | Owner/admin controllable logo URL in branding |
| **Scenario** | Server fetch to internal URL when generating PDF |
| **Impact** | Limited SSRF / info leak |
| **Mitigation** | Pass URL through `validateOutboundUrl`; allowlist image hosts |
| **Confidence** | HIGH |

### FINDING-007 — MEDIUM

| Field | Content |
|-------|---------|
| **ID** | FINDING-007 |
| **Severity** | MEDIUM |
| **CWE** | CWE-79 |
| **Files** | `white-label-theme-injector.tsx`; `white-label/validation.ts` |
| **Prerequisite** | Compromised or malicious owner/admin |
| **Scenario** | CSS breakout beyond blocked patterns |
| **Impact** | UI redress / data exfil via CSS in older browsers |
| **Mitigation** | Stronger CSS allowlist or disallow freeform CSS |
| **Confidence** | MEDIUM |

### FINDING-008 — MEDIUM

| Field | Content |
|-------|---------|
| **ID** | FINDING-008 |
| **Severity** | MEDIUM |
| **CWE** | CWE-200 |
| **Files** | `src/app/api/health/route.ts`; `status/route.ts`; `observability/health.ts` |
| **Scenario** | Unauthenticated discovery of mollie/ai/db configuration booleans + version |
| **Impact** | Recon aid |
| **Mitigation** | Authenticate status or reduce fields on public `/status` |
| **Confidence** | HIGH |

### FINDING-009 — LOW

| Field | Content |
|-------|---------|
| **ID** | FINDING-009 |
| **Severity** | LOW |
| **CWE** | CWE-200 |
| **Files** | `20250624140000_production_infrastructure.sql:92-97` |
| **Scenario** | Any authenticated user reads global job catalog |
| **Impact** | Minor recon |
| **Mitigation** | Restrict SELECT to owner/admin if catalog considered sensitive |
| **Confidence** | HIGH — **not a tenant data leak** |

### FINDING-010 — LOW

| Field | Content |
|-------|---------|
| **ID** | FINDING-010 |
| **Severity** | LOW |
| **CWE** | CWE-1104 |
| **Files** | npm audit report |
| **Scenario** | Toolchain compromise / malicious stats file for browserslist |
| **Impact** | Build agent DoS / prototype issues |
| **Mitigation** | Scheduled `npm audit fix` after CI validation |
| **Confidence** | HIGH |

### FINDING-011 — LOW

| Field | Content |
|-------|---------|
| **ID** | FINDING-011 |
| **Severity** | LOW |
| **CWE** | CWE-863 |
| **Files** | `src/lib/api/auth/context.ts:100-109`; `src/lib/api/middleware/handler.ts:47-53`; `src/lib/api/auth/validator.ts:66` |
| **Route** | `/api/v1/*` |
| **Prerequisite** | Owner/admin issues API key with broad scopes (or workspace key) |
| **Trust boundary** | Key scopes are authoritative; unused `assertScopeMatchesRbac` would also require creator/synthetic role to pass module RBAC |
| **Scenario** | Workspace key treated as `"admin"` for role fields; personal key with over-granted scopes can call matching routes regardless of creator’s live dashboard role |
| **Impact** | Defense-in-depth gap only if key issuance is abusive; tenant boundary still org-bound |
| **Mitigation** | Wire `assertScopeMatchesRbac` into `withApiHandler`, or document scopes-as-authority and tighten key minting UX |
| **Confidence** | HIGH |

### Non-findings (false positives controlled)

| Observation | Why not counted vulnerable |
|-------------|----------------------------|
| Mollie no HMAC | Classic Mollie model + API re-fetch + ownership |
| FastSpring routes present | Return 410; no processing |
| Public OpenAPI | Spec only |
| service_role usage volume | Expected for workers; not client-exposed |
| `probe=1` on cron | Still requires Bearer secret |

---

## 28. ATTACK-PATH ANALYSIS (EVIDENCE-SUPPORTED ONLY)

### Path A — PostgREST privilege escalation (conditional CRITICAL)

1. Attacker authenticates as `viewer`/`staff` in Org A.  
2. Calls Supabase REST `PATCH users?auth_user_id=eq.<self>` with `{role:"owner"}` or foreign `organization_id`.  
3. **If** production still has foundation `users_update_self` WITHOUT lock migration → succeeds → full admin of Org A or pivot.  
4. **If** `20260903160000` applied → WITH CHECK fails → blocked.

### Path B — Portal lateral (conditional CRITICAL)

Same class on `client_portal_users` retargeting `client_id`/`organization_id` affecting SECURITY DEFINER portal helpers — blocked only if `20260903170000` live.

### Path C — CRON_SECRET leak → platform control (HIGH)

1. Secret obtained.  
2. `GET /api/cron/run?job=…` force executes registered jobs.  
3. Optionally operator recovery endpoints when live charging disabled.

### Path D — False entitlement via webhook alone (NOT SUPPORTED)

Webhook without matching paid Mollie payment + ownership should ignore/fail; no evidence of client plan trust.

---

## 29. SAFE VALIDATION PERFORMED

| Check | Result |
|-------|--------|
| `git` HEAD / branch | `main` @ `1334415` |
| Migration files present | Yes |
| Grep DISABLE RLS / USING(true) / secrets patterns | Done |
| Read critical routes / env / RLS / Mollie / RBAC | Done |
| `npm audit` read-only | Done |
| Production cron invoke | **NOT DONE** (forbidden) |
| Production PostgREST exploit proof | **NOT DONE** (would be active attack; prior report already proved class) |
| Live migration apply query on Supabase | **NOT DONE** — **UNVERIFIED** |

---

## 30. FINAL REPORT — DOMAIN VERDICTS & GATES

### Domain verdicts

| Domain | Verdict |
|--------|---------|
| Authentication | **PASS** (obs: rate limit durability) |
| Authorization / RBAC (app) | **PASS** |
| Multi-tenancy (app APIs) | **PASS** |
| Multi-tenancy (RLS production locks) | **UNVERIFIED / FAIL GATE** |
| Supabase RLS (repo) | **PASS** after migrations |
| API routes | **PASS** |
| Cron | **SECURE** |
| Webhooks Mollie | **PASS** (obs) |
| Billing / entitlements | **PASS** |
| SSRF | **PASS** (obs) |
| Injection / XSS | **PASS** (obs) |
| CSRF | **PASS** |
| CORS | **PASS** |
| Rate limit | **FAIL** (shared durability) |
| Secrets (source) | **PASS** |
| Logging | **PASS** (obs) |
| Security headers | **PASS** (obs) |
| Open redirect | **PASS** |
| Files / exports | **PASS** (obs) |
| Client portal | **UNVERIFIED** (RLS lock apply) |
| Admin / diagnostic | **PASS** |
| npm audit | **PASS** (obs) |
| Next.js App Router | **PASS** |
| Scanner path handling | **PASS** (source) |

### Final Security Gate A–G

| Gate | Criterion | Result |
|------|-----------|--------|
| **A** | No unauthenticated privileged execution (cron/admin) | **PASS** (source) |
| **B** | Tenant isolation Org A ↛ Org B on app APIs | **PASS** |
| **C** | Production RLS privilege/tenant locks confirmed applied | **PASS** (live 2026-09-08; migration-history bookkeeping still outstanding) |
| **D** | Entitlements not client-controlled | **PASS** |
| **E** | Webhook authenticity model sound | **PASS** |
| **F** | Secrets not in client/git | **PASS** |
| **G** | Abuse controls production-grade (distributed rate limits) | **FAIL** |

**Overall gate:** **NOT CLEARED** until Gate C confirmed and Gate G accepted or remediated.

### Prioritized remediation plan (DO NOT IMPLEMENT IN THIS AUDIT)

1. ~~**P0 ops:** apply portal/users RLS locks~~ → **DONE 2026-09-08** for live enforcement; optional: reconcile `schema_migrations` for `2026090316/170000` without re-applying users SQL.  
3. **P1:** Replace in-memory rate limits with shared limiter + WAF rules for `/login`, signup, reset, `/api/v1/*`.  
4. **P1:** Treat `CRON_SECRET` as tier-0; rotate; consider split secrets for operator vs cron; restrict probe.  
5. **P2:** CSP nonces; PDF logo through `validateOutboundUrl`; tighten public `/api/status` fields.  
6. **P2:** Schedule dependency upgrades for `browserslist` / `fflate` after CI.  
7. **P3:** Revisit freeform white-label CSS; job catalog SELECT scope.  
8. **P3:** Decide whether `/api/v1` should enforce `assertScopeMatchesRbac` or formally document scopes-as-authority; rate-limit `/api/ready` and `/api/status` like `/api/health`.

---

## 31. STOP

- **No application code remediated.**  
- **No commit / push / deploy.**  
- **Only deliverable written:** this report file (later amended to merge complete API inventory).  
- **NO REMEDIATION PERFORMED.**

---

### Addendum — API inventory completion (same audit day)

Complete per-route inventory from [Inventory API route auth](49bb5e51-45dc-4a80-b845-829187666b6f) was merged into §2.1 / §7: corrected HTTP methods (most `/api/v1/*` collections are GET-only), documented `/api/v1/me` no-scope auth, unused `assertScopeMatchesRbac` (FINDING-011), and `/ready`/`/status` missing health rate limits. **Executive verdict unchanged.**

*End of forensic audit report.*
