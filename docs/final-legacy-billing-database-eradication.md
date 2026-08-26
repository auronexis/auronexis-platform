# Final Legacy Billing Database Eradication

**Date:** 2026-08-26  
**Scope:** Quarantine historical `organization_subscriptions` rows; enforce Mollie-only paid authority in code + DB constraints  
**LIVE charging:** unchanged / fail-closed (`MOLLIE_LIVE_CHARGING_ENABLED=false`)  
**Commit intent:** `fix: quarantine legacy billing rows and enforce Mollie authority` (local only; operator applies migration)

---

## 1. Executive verdict

**LEGACY_DB_REMEDIATION_READY_FOR_OPERATOR_APPLY**

Engineering closes the P0 gap where one production **active FastSpring** row (and potentially one **active Stripe** row with NULL `provider_*`) could influence provider resolution or entitlements before Mollie authority was enforced at the row level. Code now treats all stripe/paddle/fastspring rows as quarantined; a forward-only migration archives them in place without renaming providers or deleting audit IDs.

---

## 2. Repository forensics (Phase 0)

| Check | Result |
|-------|--------|
| Branch | `main` |
| Working tree | **Clean** (no unrelated dirty changes) |
| HEAD | `2c165fc` — `fix: quarantine legacy billing rows and enforce Mollie authority` |
| Ahead/behind | **Ahead of `origin/main` by 2 commits** (not pushed) |
| Prior commits | `03f00eb` (operator closeout doc), `d9ad461` (LIVE gate doc on origin) |

Proceeding was safe — no unrelated dirty changes blocked the task.

---

## 3. Production finding (operator evidence)

Counts on `public.organization_subscriptions` (treat as real):

| billing_provider | count | notes |
|------------------|------:|-------|
| mollie | 3 | authoritative when usable |
| fastspring | 1 | **status=active, provider_status=active, provider_* populated** |
| paddle | 1 | status=canceled |
| stripe | 2 | one inactive NULL provider_*; one **active** NULL provider_* |

Current CHECK: `billing_provider IN ('stripe','paddle','fastspring','mollie')`.

**P0 before fix:** YES — active FastSpring row could grant paid entitlements via `resolveOrganizationBillingProvider` → `fastspring` ownership + usable status flags.

---

## 4. Code path trace (organization_subscriptions → authority)

| Path | File(s) | Pre-fix risk | Post-fix |
|------|---------|--------------|----------|
| Entitlements | `src/lib/entitlements/resolver.ts` | `rows[0]` hint + FastSpring usable | Mollie hint only; quarantined rows excluded |
| Effective plan / nav | `src/lib/plans/effective-plan.ts`, `queries.ts` | Same hint bug | `pickSubscriptionProviderHintRow` |
| Billing UI | `src/lib/billing/queries.ts` | Legacy row as “current” | Authoritative Mollie row only |
| Provider ownership | `src/lib/billing/provider-selection.ts` | FastSpring ownership | **Mollie-only ownership** |
| Row selection | `src/lib/billing/subscription-selection.ts` | ORDER BY updated_at across providers | Filter quarantined first |
| Active billing flags | `src/lib/billing/active-billing.ts` | Legacy rows active | Quarantined → never active |
| Mollie sync / checkout | `organization-sync.ts`, `production-checkout.ts` | Blocked or conflicted on legacy | Allows replace when quarantined |
| Reconciliation | `providers/mollie/webhooks.ts` | Already Mollie-only writes | Unchanged |
| Invoices | Mollie webhook + `sales_invoices` | No legacy invoice writers | Unchanged |
| Cron snapshots | `billing-snapshots.ts` | All `active` rows | Mollie + `legacy_archived=false` only |
| Diagnostics | `billing-diagnostics-panel.tsx`, `hygiene.ts` | Could surface legacy as current | Preferred row is Mollie-only |
| Maintenance | `maintenance.ts` | Neutralizes stale Stripe only | Unchanged; legacy quarantined by migration |

---

## 5. P0 entitlement proof

### Before fix

1. Org with only FastSpring row, `status=active`, populated `provider_*`.
2. `getOrganizationBillingProvider({ subscription: rows[0] })` → **fastspring**.
3. `selectPreferredSubscriptionRow(..., "fastspring")` → usable FastSpring row.
4. `resolveOrganizationEntitlements` → **`isPaidAccess: true`** if price maps.

### After fix (code + migration)

1. `isLegacyQuarantinedSubscriptionRow(row)` → **true** for all legacy providers.
2. `pickSubscriptionProviderHintRow` → **null** (no Mollie row).
3. `getOrganizationBillingProvider` → **mollie** (global default).
4. `selectPreferredSubscriptionRow` → **null** (no authoritative rows).
5. Entitlements → **`isPaidAccess: false`** unless plan override / dev force.

**ENTITLEMENTS Legacy rows can grant access after fix: NO**

---

## 6. Architecture chosen

**Minimal safe approach:**

1. **Additive DB quarantine** — `legacy_archived`, `legacy_archived_at`; demote billable status; preserve `billing_provider` + all audit IDs.
2. **Code authority** — new `src/lib/billing/legacy-quarantine.ts`; Mollie-only ownership; never use `rows[0]` for provider hints.
3. **CHECK constraint** — legacy rows cannot hold billable statuses; only Mollie rows may be non-archived authority.
4. **No** provider renames, **no** row deletes, **no** Mollie runtime architecture changes.

---

## 7. Migration design

**File:** `supabase/migrations/20250826200000_legacy_billing_db_quarantine.sql`

| Step | Action |
|------|--------|
| Add columns | `legacy_archived boolean NOT NULL DEFAULT false`, `legacy_archived_at timestamptz` |
| Quarantine UPDATE | `WHERE billing_provider IN ('stripe','paddle','fastspring') AND legacy_archived = false` |
| Status demotion | Billable → `inactive`; `provider_status` → `legacy_quarantined` where applicable |
| Pending clears | Clears pending plan / upgrade attempt fields on legacy rows only |
| Constraint | `organization_subscriptions_legacy_authority_check` |
| Index | Partial index on Mollie non-archived rows |

Idempotent: safe to re-run ADD IF NOT EXISTS; UPDATE only touches `legacy_archived = false` legacy rows.

---

## 8. Pre-migration operator SQL (READ-ONLY)

```sql
-- Row counts by provider
SELECT billing_provider, COUNT(*) AS n
FROM public.organization_subscriptions
GROUP BY 1 ORDER BY 1;

-- Billable legacy rows (expect ≥1 FastSpring active before apply)
SELECT id, organization_id, billing_provider, status, provider_status,
       provider_subscription_id IS NOT NULL AS has_provider_sub
FROM public.organization_subscriptions
WHERE billing_provider IN ('stripe', 'paddle', 'fastspring')
  AND status IN ('active', 'trialing', 'past_due', 'unpaid', 'incomplete')
ORDER BY billing_provider, updated_at DESC;
```

---

## 9. Post-migration operator SQL (verification)

```sql
-- Invariant: no non-archived legacy rows
SELECT COUNT(*) AS legacy_unarchived
FROM public.organization_subscriptions
WHERE billing_provider IN ('stripe', 'paddle', 'fastspring')
  AND legacy_archived = false;
-- Expect: 0

-- Invariant: no billable archived legacy rows
SELECT COUNT(*) AS legacy_still_billable
FROM public.organization_subscriptions
WHERE legacy_archived = true
  AND status IN ('active', 'trialing', 'past_due', 'unpaid', 'incomplete');
-- Expect: 0

-- Authority rows (Mollie only)
SELECT billing_provider, legacy_archived, status, COUNT(*)
FROM public.organization_subscriptions
GROUP BY 1, 2, 3 ORDER BY 1, 2, 3;
```

---

## 10. Target invariants (after operator apply)

| Invariant | Status |
|-----------|--------|
| Paid entitlements only from `billing_provider='mollie'` + usable policy | **YES** (code now; DB after migration) |
| Legacy rows never authorize paid plan / upgrade / renewal / invoice / entitlement | **YES** |
| Future writes cannot create new active stripe/paddle/fastspring subscriptions | **YES** (CHECK) |
| Reconciliation Mollie-only | **YES** (unchanged) |
| UI must not show legacy as current billing | **YES** |

---

## 11. Legacy authority after fix

| Provider | Can grant paid access | Can block Mollie checkout | Can reconcile |
|----------|----------------------|---------------------------|---------------|
| fastspring | **0** | **0** | **0** |
| paddle | **0** | **0** | **0** |
| stripe | **0** | **0** | **0** |

Format: **0 / 0 / 0** (entitlements / checkout block / reconciliation)

---

## 12. Code changes summary

| File | Change |
|------|--------|
| `src/lib/billing/legacy-quarantine.ts` | **NEW** — quarantine + hint helpers |
| `src/lib/billing/provider-selection.ts` | Mollie-only ownership |
| `src/lib/billing/subscription-selection.ts` | Filter quarantined rows |
| `src/lib/billing/active-billing.ts` | Reject quarantined for active billing |
| `src/lib/billing/queries.ts` | Select quarantine columns; safe hint |
| `src/lib/entitlements/resolver.ts` | Safe hint; doc update |
| `src/lib/plans/effective-plan.ts` | Safe hint |
| `src/lib/plans/queries.ts` | Select `legacy_archived` |
| `src/lib/billing/providers/mollie/organization-sync.ts` | Allow quarantined overwrite |
| `src/lib/billing/providers/mollie/production-checkout.ts` | Allow checkout on quarantined legacy |
| `src/lib/jobs/handlers/billing-snapshots.ts` | Mollie-only scope |
| `src/types/database.ts` | Type columns |
| `scripts/legacy-billing-db-quarantine.test.mjs` | **NEW** regression suite |
| `package.json` | Wire test script |

---

## 13. Reconciliation & invoices

| Surface | Legacy rows processed? | New invoices from legacy? |
|---------|------------------------|---------------------------|
| Mollie webhooks | **NO** | **NO** |
| Mollie organization sync | Only replaces quarantined row on new checkout | **NO** |
| Archive Stripe/Paddle webhooks | Retired (410) | **NO** |

**RECONCILIATION Legacy rows processed: NO**  
**INVOICES Legacy rows can issue new invoice: NO**

---

## 14. UI / diagnostics impact

- Settings → Billing shows preferred **Mollie** row only.
- Legacy rows may still appear in maintenance/diagnostics **all subscriptions** list as historical audit (labeled inactive / quarantined after migration).
- No legacy provider shown as “current plan” when Mollie row exists.

**CURRENT BILLING AUTHORITY Mollie-only: YES**

---

## 15. Regression tests added

`scripts/legacy-billing-db-quarantine.test.mjs` — 12 source-contract tests covering:

- Quarantine module
- Provider selection Mollie-only
- Subscription selection filter
- Entitlements / effective-plan hint safety
- Mollie sync + checkout quarantine overwrite
- Billing snapshots scope
- Migration integrity (no provider rename)
- Database types

Run: `npm run test:legacy-billing-db-quarantine`

---

## 16. Validation gates (engineering)

Executed after code changes (fill SHA after commit):

| Gate | Command | Expected |
|------|---------|----------|
| Typecheck | `npm run typecheck` | PASS |
| Lint | `npm run lint` | PASS |
| Build | `npm run build` | PASS |
| Mollie suite | `npm run test:mollie-billing` | PASS |
| Enterprise regression | `npm run test:enterprise-regression` | PASS |
| Legacy billing removal | `npm run test:legacy-billing-removal` | PASS |
| Legacy DB quarantine | `npm run test:legacy-billing-db-quarantine` | PASS |
| Final LIVE gate | `npm run test:final-live-billing-gate` | PASS |
| Production readiness | `npm run test:production-readiness` | PASS |
| Billing/tax | `npm run test:p1-002-pricing-tax` | PASS |

---

## 17. LIVE charging safety

| Control | Value |
|---------|-------|
| `MOLLIE_LIVE_CHARGING_ENABLED` | **false** (unchanged) |
| Production checkout | TEST / controlled mode only |
| This task | **Does not** enable live charging, deploy, or push |

---

## 18. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Org had paid FastSpring only | Quarantine + support-led Mollie re-checkout; plan override for interim access if contractually required |
| Migration applied before code deploy | Brief window: legacy still in DB but old code — **deploy code first**, then migration |
| Unique `organization_id` | Mollie upsert replaces quarantined row on new purchase (explicit checkout, not silent rename) |
| Historical audit | All IDs preserved; `legacy_archived_at` timestamp |

---

## 19. Operator action checklist

1. **Deploy application** with this commit (code quarantine works even pre-migration).
2. **Backup / PITR** confirm per `docs/disaster-recovery.md`.
3. Run **pre-migration SQL** (section 8); save output.
4. Apply migration: `20250826200000_legacy_billing_db_quarantine.sql` via Supabase CLI or dashboard.
5. Run **post-migration SQL** (section 9); confirm all invariants zero.
6. Spot-check affected orgs in Settings → Billing diagnostics (legacy inactive; Mollie authoritative).
7. **Do not** set `MOLLIE_LIVE_CHARGING_ENABLED=true` as part of this task.

---

## 20. Final response block (operator copy)

```
VERDICT: LEGACY_DB_REMEDIATION_READY_FOR_OPERATOR_APPLY
PRODUCTION FINDING (counts): mollie=3, fastspring=1 (active P0), paddle=1, stripe=2
LEGACY AUTHORITY after fix (0/0/0)
CURRENT BILLING AUTHORITY Mollie-only YES
ENTITLEMENTS Legacy rows can grant access NO
RECONCILIATION Legacy rows processed NO
INVOICES Legacy rows can issue new invoice NO
DATABASE migration: 20250826200000_legacy_billing_db_quarantine.sql
VALIDATION: see section 16 (run after commit)
LIVE CHARGING: MOLLIE_LIVE_CHARGING_ENABLED=false (unchanged)
REPORT: docs/final-legacy-billing-database-eradication.md
OPERATOR ACTION: deploy code → apply migration → verify section 9 SQL
```

---

## Report metadata

| Field | Value |
|-------|-------|
| Migration | `supabase/migrations/20250826200000_legacy_billing_db_quarantine.sql` |
| Report | `docs/final-legacy-billing-database-eradication.md` |
| Local commit | `2c165fc` — `fix: quarantine legacy billing rows and enforce Mollie authority` |
| Push | **NO** |
