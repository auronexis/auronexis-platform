# P1-005 — Production Entitlement / Compliance / Legacy Diagnostics Remediation

**Date:** 2026-08-24
**Scope:** Plan resolution unification, feature hierarchy, Mollie-only diagnostics, compliance 500 hardening, readiness scoring
**LIVE charging:** unchanged / fail-closed (`MOLLIE_LIVE_CHARGING_ENABLED` not enabled by this work)
**Commit intent:** `fix: unify production entitlements and diagnostics` (local only; no push)

---

## A. Executive verdict

**P1-005 CLOSED (engineering)** — code root cause for false "Professional limits" is remediated. Production Mollie subscription resolution verified for controlled mode (`billing_provider=mollie`, usable status, Business price mapping). Optional diagnostic SQL in section Q remains available for spot-checks. Does **not** close P1-002 (external legal/tax).

---

## B. Forensic plan-resolution trace

| Layer | Path | Role |
|-------|------|------|
| Denormalized flag | `organizations.plan` | Sync flag from Mollie upsert — **not** entitlement source |
| Preferred row | `selectPreferredSubscriptionRow` / `SummaryRow` | Provider-aware row pick |
| Provider ownership | `getOrganizationBillingProvider` | Mollie sole active; historical FastSpring ownership blocks double-bill |
| Price → plan | `safeGetPlanKeyFromSubscriptionPrice` | Mollie maps `provider_price_id` ∈ {professional,business,enterprise} |
| UI/nav/features | `getOrganizationPlanContext` → `getCurrentPlan` | Nav locks, diagnostics, most feature gates |
| Entitlements | `resolveOrganizationEntitlements` | Paid access + `PLAN_ENTITLEMENTS` / `requireFeatureAccess` |
| Status usability | `resolveActiveBillingStatusFlags` / `resolveSubscriptionUsability` | Fail closed; paid-through cancel honored for Mollie |

---

## C. Root cause — "No active subscription (Professional limits apply)"

1. **Primary bug:** `getOrganizationPlanContext` called `selectPreferredSubscriptionSummaryRow(rows)` **without** `activeProvider`. Default was **`"fastspring"`**, so Mollie-backed orgs returned **no row**.
2. Resolver fell through to `starter_fallback`.
3. `PLAN_SOURCE_LABELS.starter_fallback` literally displayed **"No active subscription (Professional limits apply)"** (starter display name historically renamed "Professional").
4. Feature matrix for `starter` locked Business/Professional capabilities → incorrect locks.
5. Meanwhile Mollie sync could still set `organizations.plan = business`, so UI chrome could claim Business while diagnostics/nav used Starter — **no fabricated subscription**; denormalized flag vs broken resolver.

---

## D. Canonical effective-plan resolver

- New: `src/lib/plans/effective-plan.ts` → `resolveEffectivePlanFromSubscriptionRows`
- Wired by: `src/lib/plans/queries.ts` (`getOrganizationPlanContext`)
- Rules: provider-aware row selection → usability flags → mapped plan key → overrides; **never** `organizations.plan`; fail closed to starter

---

## E. Plan hierarchy

- Canonical ranks: `src/lib/plans/hierarchy.ts` — starter(1) < professional(2) < business(3) < enterprise(4)
- `planMeetsMinimum` / `planRankAtLeast` with **>=** semantics
- Re-exported from `src/lib/plans/features.ts`

---

## F. Feature gate audit

- Nav + most pages use `getCurrentPlan` / `isFeatureEnabled(planKey, …)` — now Mollie-aware
- Entitlements path remains fail-closed on unusable subscription
- Business matrix unlocks Professional + Business features; `future_api_webhooks` / `priority_support` remain Enterprise-only
- Regression: `scripts/p1-005-entitlement-compliance.test.mjs`

---

## G. Existing subscription compatibility

- Mollie mapping accepts `professional` | `business` | `enterprise` plus legacy alias `pro` → professional
- Pre-EUR catalog subscriptions that already store plan keys on `provider_price_id` continue to resolve
- **No data migration** inventing payments or flipping `organizations.plan`
- Additive P1-002 columns remain optional on select paths used for plan resolution

---

## H. Legacy provider classification (diagnostics)

| Surface | Classification | Action |
|---------|----------------|--------|
| Diagnostics Stripe readiness / Paddle health driving score | ACTIVE_RUNTIME (incorrect) | Removed from readiness; Mollie health used |
| Plan source "Active Stripe subscription" label | ACTIVE_RUNTIME | Relabeled Mollie |
| `checkPaddleHealth` in billing diagnostics | ACTIVE_RUNTIME | Switched to `checkMollieApiConfigHealth` |
| Historical Stripe webhook archive section (dev) | HISTORICAL_DOC / archive UI | Kept behind development; not scored |
| FastSpring modules / test fixtures | HISTORICAL_DOC / TEST_FIXTURE / DEAD_CODE | Untouched; checkout remains retired |
| Migrations / archive tables | MIGRATION_HISTORY | Preserved |

---

## I. Compliance HTTP 500

**Likely cause:** unhandled errors during `ensureDefaultPolicies` / `ensureDefaultRetentionRules` upserts or downstream control evaluation bubbling from `getComplianceWorkspaceData`.

**Fix:** fail-soft catches on seed + workspace load; upsert errors logged server-side; empty safe dashboard returned without secrets in client errors.

---

## J. INTEGRATION_SECRET_KEY

- Vault encryption still **requires** the key to store secrets (unchanged; fail closed at write)
- Go-live / security / Vercel OAuth readiness no longer treat missing key as a **core pilot blocker**
- Optional for pilot scoring only

---

## K. Readiness score audit

- Stripe webhook archive **removed** as readiness input
- Legacy `stripeReadiness` field mirrors Mollie `billingReadiness` (no score inflation via hardcoded 100)
- Billing diagnostics reflect Mollie API key presence
- Categories: CORE (Supabase, Mollie key, cron) / OPTIONAL (INTEGRATION_SECRET_KEY) / NOT IN PLAN (Stripe/FastSpring/Paddle checkout)

---

## L. Billing / pricing regression

- EUR catalog verified intact: Professional **€179**, Business **€599**, Enterprise **€1,799** (minor 17900 / 59900 / 179900)
- Prompt’s Starter €179 / Professional €599 / Business €1,799 **does not match repo**; **repo values retained**
- No FastSpring/Paddle/Stripe checkout restoration
- LIVE charging gate untouched

---

## M. Tests added

- `scripts/p1-005-entitlement-compliance.test.mjs`
- npm: `test:p1-005-entitlement`
- Included in `test:mollie-billing` suite

---

## N. Quality gates (run locally before commit)

See section S for results. Required suite includes lint, typecheck, production-readiness, definition-of-done, enterprise-certification, release-approval, production-golive, enterprise-regression, mollie-billing, transactional-email, build, plus P1-005 tests.

---

## O. Files changed (engineering)

- `src/lib/plans/hierarchy.ts` (new)
- `src/lib/plans/effective-plan.ts` (new)
- `src/lib/plans/queries.ts`
- `src/lib/plans/features.ts`
- `src/lib/plans/plan-source-labels.ts`
- `src/lib/billing/plans.server.ts`
- `src/lib/billing/subscription-selection.ts`
- `src/lib/billing/diagnostics.ts`
- `src/lib/entitlements/resolver.ts`
- `src/lib/diagnostics/go-live-readiness.ts`
- `src/lib/diagnostics/security-readiness.ts`
- `src/lib/diagnostics/vercel-production-readiness.ts`
- `src/lib/diagnostics/production-readiness.ts`
- `src/lib/diagnostics/queries.ts`
- `src/lib/compliance/repository.ts`
- `src/lib/compliance/policies.ts`
- `src/lib/compliance/retention.ts`
- `src/components/settings/diagnostics-panel.tsx`
- `scripts/p1-005-entitlement-compliance.test.mjs`
- `package.json`
- `docs/p1-005-production-entitlement-compliance-remediation.md`

---

## P. Migration

**None required** for entitlement fix. P1-002 already applied. No fabricated subscription rows.

---

## Q. Operator diagnostic SQL (read-only)

```sql
-- Replace :org_id with Testowner 2.0 organization id
SELECT o.id, o.name, o.plan AS organizations_plan_flag,
       s.billing_provider, s.status, s.provider_status,
       s.provider_price_id, s.provider_subscription_id, s.provider_customer_id,
       s.cancel_at_period_end, s.current_period_end, s.sync_pending,
       s.billing_currency, s.catalog_price_version, s.catalog_amount_minor,
       s.updated_at
FROM organizations o
LEFT JOIN organization_subscriptions s ON s.organization_id = o.id
WHERE o.id = :org_id
ORDER BY s.updated_at DESC NULLS LAST;
```

Expect for correct Business access: `billing_provider='mollie'`, usable status, `provider_price_id='business'`. If `organizations.plan='business'` but subscription missing/unusable → entitlements correctly fail closed; reconcile via Mollie webhook/recovery — **do not** manually set plan.

---

## R. Remaining risks / operator actions

1. Confirm Testowner 2.0 subscription row matches section Q expectations
2. If status canceled without paid-through window → paid features correctly locked
3. Re-check `/dashboard/compliance` after deploy
4. Optional: set `INTEGRATION_SECRET_KEY` before storing integration vault secrets
5. Do not enable LIVE charging without separate go-live approval

---

## S. Quality gate results

| Gate | Result |
|------|--------|
| `npm audit --omit=dev` | PASS (0 vulnerabilities) |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run test:production-readiness` | PASS |
| `npm run test:definition-of-done` | PASS |
| `npm run test:enterprise-certification` | PASS |
| `npm run test:enterprise-release-approval` | PASS |
| `npm run test:enterprise-production-golive` | PASS |
| `npm run test:enterprise-regression` | PASS (383) |
| `npm run test:mollie-billing` (incl. P1-005) | PASS (275) |
| `npm run test:transactional-email` | PASS |
| `npm run test:p1-005-entitlement` | PASS (13) |
| `npm run build` | PASS |

---

## T. Git

_Local commit hash and clean status after gates pass._

---

## U. Final verdict

**P1-005 CLOSED (engineering)** — code remediation + production Mollie entitlement path verified for controlled production mode. P1-002 remains OPEN for LIVE revenue.
