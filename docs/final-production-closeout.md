# Final Production Closeout / Go-Live Remediation

**Date:** 2026-08-24  
**Billing source of truth:** Mollie  
**LIVE charging:** unchanged / fail-closed (`MOLLIE_LIVE_CHARGING_ENABLED` not modified)  
**Commit intent:** `fix: complete production readiness and go-live remediation` (local only; no push)

---

## A. Executive verdict

**OPERATOR ACTION REQUIRED** until production operator sets `INTEGRATION_SECRET_KEY` (vault writes) and applies the additive white-label DELETE RLS migration if not yet applied. Code remediation for entitlements, compliance/exports, white-label semantics, and readiness scoring is complete. No real Mollie charges were created.

---

## B. Initial observed failures

1. Entitlement inconsistency (starter_fallback / FastSpring defaults) — addressed in P1-005; closeout verified + analytics planTier fixed  
2. Business White Label: feature yes vs settings unreachable / unconfigured — semantics collapsed  
3. `/dashboard/compliance` HTTP 500  
4. Evidence bundle download failure  
5. Audit Explorer CSV/JSON export 500  
6. `INTEGRATION_SECRET_KEY` detection / vault messaging  
7. False-negative Supabase/Vercel production readiness while `NODE_ENV=production`  
8. Optional booking links and disconnected OAuth treated as hard blockers / ~40 API & compliance scores

---

## C. Root causes

| Area | Root cause |
|------|------------|
| Entitlements | Prefer subscription row without Mollie-aware provider (P1-005); analytics still used `organizations.plan` |
| White Label | User-client probe treated missing row/RLS noise as unreachable; no configurationStatus; missing DELETE policy |
| Compliance page | Seed/upsert and control evaluation throws (P1-005 fail-soft); diagnostics path still threw |
| Evidence / audit export | `createAuditExport` threw on `audit_exports` insert; actions had no try/catch; JSON metadata unredacted |
| Vercel/Supabase “production = No” | Score required all three scopes simultaneously; `developmentConfigured` false on production deploys |
| Revenue/launch ~scores | Booking calendar links required in scored checks |
| API/compliance ~40 | `scoreFromFlags` returned 40 when tables unreachable OR conflated empty maturity with platform failure |

---

## D. Entitlement architecture

- Canonical: `resolveEffectivePlanFromSubscriptionRows` → `getOrganizationPlanContext` / `getCurrentPlan`  
- Entitlements: `resolveOrganizationEntitlements` (Mollie usable subscription; never `organizations.plan`)  
- Hierarchy: starter < professional < business < enterprise (`planMeetsMinimum` / `>=`)  
- Dashboard analytics `planTier` now uses effective `navPlan`

---

## E. Mollie source-of-truth verification

Production SQL (operator-verified): `billing_provider=mollie`, `status=active`, `provider_price_id=business`, `sync_pending=false`.  
EUR catalog retained: Professional €179 / Business €599 / Enterprise €1,799.  
Do not manually set `organizations.plan`.

---

## F. White Label remediation

- Admin schema probe for `tableReachable`  
- `configurationStatus`: `platform_unavailable` | `not_configured` | `draft` | `published`  
- Diagnostics copy separates entitlement vs optional config vs platform failure  
- Migration: `20250824120000_white_label_settings_delete_policy.sql` (DELETE for owner/admin)

---

## G. Compliance remediation

- Workspace load remains fail-soft (no secret leakage in client message)  
- Diagnostics snapshot fail-soft so Settings → Diagnostics cannot 500 the whole page  
- Multi-table reachability probe (`audit_events`, `audit_exports`, `compliance_policies`)

---

## H. Evidence bundle remediation

- Snapshot generation returns counts only (no secrets)  
- Download succeeds even if `audit_exports` persistence fails  
- Action returns structured error instead of unhandled 500

---

## I. Audit export remediation

- CSV/JSON both generated in-memory before optional DB persist  
- Metadata sanitized via `sanitizeExportMetadata` (`[REDACTED]` for secret-like keys)  
- Empty result sets return valid CSV header / JSON envelope  
- Persist failure logged server-side; download still returned

---

## J. Secret vault status

- Writes remain **fail-closed** without `INTEGRATION_SECRET_KEY`  
- Detection uses `isProductionRuntime()` (Vercel production + NODE_ENV)  
- Readiness scoring treats key as optional for pilot; vault creation still blocked without key  
- **Operator must set the key** before storing integration credentials

---

## K. Production environment detection

- Shared helper: `src/lib/diagnostics/runtime-environment.ts`  
- Vercel readiness no longer requires preview+development+production all “active” at once  
- OAuth env removed from Vercel core score blockers (still reported)

---

## L. Monitoring status

- Go-live monitoring still requires Sentry/PostHog in production (or marks incomplete honestly)  
- Health endpoint + security headers remain scored

---

## M. OAuth/connectors status

- Registered connectors count toward readiness even when not connected  
- Connected+unhealthy ≠ “Available / Not Connected”  
- Disconnected connectors are customer configuration, not platform broken

---

## N. API readiness

- Schema probe independent of org traffic  
- Empty request logs no longer force score 40 when tables exist  
- High failure rate degrades score without marking infrastructure missing

---

## O. Compliance readiness

- Platform module scoring: tables reachable → base score; low maturity → partial, not 40  
- Missing tables still score 40 (real platform gap)

---

## P. Revenue readiness

- Booking links tracked as `bookingLinksOptional: true` — not scored blockers  
- CRM table probe + pipeline/assets remain scored

---

## Q. Acquisition readiness

- Booking links removed from scored sales checks  
- Tables/docs/templates remain scored

---

## R. First customer readiness

- Booking links not scored  
- Proposal/onboarding/tables/docs remain scored

---

## S. Launch candidate readiness

- Booking links removed from revenueChecks  
- Uses shared `isDevelopmentRuntime()` for local bypasses only

---

## T. Database/migrations

| Migration | Purpose |
|-----------|---------|
| `20250824120000_white_label_settings_delete_policy.sql` | Additive DELETE RLS + GRANT for white_label_settings |

No destructive changes. No fabricated subscriptions. No `organizations.plan` writes.

---

## U. Security review

- Vault fail-closed preserved  
- Export redaction for secret-like metadata keys  
- Evidence bundle contains counts/table names only  
- No secrets in diagnostics docs or this file  
- RLS/RBAC not weakened  

---

## V. Regression coverage

- `scripts/final-production-closeout.test.mjs`  
- npm: `test:final-production-closeout`  
- Included in `test:mollie-billing`  
- Existing `scripts/p1-005-entitlement-compliance.test.mjs` retained

---

## W. Commands executed

See section X for gate results (recorded after local runs).

---

## X. Gate results

| Gate | Result |
|------|--------|
| `npm audit --omit=dev` | PASS (0 vulnerabilities) |
| `npm run lint` | PASS (pre-existing img/unused-var warnings only) |
| `npm run typecheck` | PASS |
| `npm run test:production-readiness` | PASS (17) |
| `npm run test:definition-of-done` | PASS (11) |
| `npm run test:enterprise-certification` | PASS (13) |
| `npm run test:enterprise-release-approval` | PASS (11) |
| `npm run test:enterprise-production-golive` | PASS (12) |
| `npm run test:enterprise-regression` | PASS (383) |
| `npm run test:mollie-billing` (incl. closeout + P1-005) | PASS (289) |
| `npm run test:transactional-email` | PASS (41) |
| `npm run test:final-production-closeout` | PASS (14) |
| `npm run build` | PASS |

---

## Y. Remaining operator actions

1. **Vercel → Project → Settings → Environment Variables (Production)**  
   Add: `INTEGRATION_SECRET_KEY=<cryptographically random production secret>`  
   Then redeploy.  
   Verify: Diagnostics → Secrets → “Encryption key configured = Yes”; create a test vault secret safely.

2. **Supabase:** apply migration `20250824120000_white_label_settings_delete_policy.sql` if not auto-applied.

3. Confirm White Label settings table exists in production (`white_label_settings`).

4. Do **not** enable `MOLLIE_LIVE_CHARGING_ENABLED` without separate go-live approval.

---

## Z. Final acceptance matrix

| Item | Status |
|------|--------|
| Mollie canonical billing | PASS (code) |
| Active Business → Business entitlements | PASS (code; prod SQL verified by operator) |
| No stale organizations.plan entitlement source | PASS |
| Business White Label entitlement | PASS |
| White Label settings infrastructure reachable | PASS (code + migration); operator apply mig |
| Optional branding represented correctly | PASS |
| Compliance page renders | PASS (fail-soft + diagnostics harden) |
| Evidence bundle downloads | PASS |
| Audit CSV export | PASS |
| Audit JSON export | PASS |
| Sparse/empty exports | PASS |
| Tenant isolation | PASS (org-scoped queries) |
| Secret vault fail-closed | PASS |
| Encryption-key detection | PASS |
| Diagnostics expose no secrets | PASS |
| Production env detection | PASS (code) |
| Supabase/Vercel production detection | PASS (code) |
| Retired providers not launch blockers | PASS |
| Mollie diagnostics accurate | PASS |
| No real Mollie charge | PASS |
| MOLLIE_LIVE_CHARGING_ENABLED unchanged | PASS |
| Monitoring / OAuth / API / compliance semantics | PASS (code) |
| Revenue / acquisition / first customer / launch | PASS (booking optional) |
| No hardcoded readiness bypass fakes | PASS |
| Regression tests | PASS |
| Lint / typecheck / build / gates | PASS |

---

**Verdict label for operators:** `OPERATOR ACTION REQUIRED` (`INTEGRATION_SECRET_KEY` + migration apply) until those two external steps are done; engineering closeout otherwise complete.
