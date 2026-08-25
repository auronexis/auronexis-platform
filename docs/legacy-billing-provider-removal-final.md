# Legacy Billing Provider Removal — Final Report

**Date:** 2026-08-24
**Closeout sync:** 2026-08-25 — ACTIVE_OPERATOR_DOCUMENTATION for Stripe/Paddle/FastSpring cleared in canonical go-live/deploy/runbook docs; Mollie remains sole active provider.
**Verdict:** READY FOR OPERATOR REVIEW (controlled production)
**Active provider:** Mollie (sole)
**LIVE charging:** Unchanged — `MOLLIE_LIVE_CHARGING_ENABLED=false` (SAFE CONTROLLED PRODUCTION MODE)

---

## 1. Executive summary

Stripe, Paddle, and FastSpring have been eradicated from **user- and operator-visible product surfaces**. Mollie is the sole active billing provider. Historical DB columns, archive tables, and retired code modules remain read-only for audit. No destructive DB operations, no RLS/RBAC weakening, no payment/subscription logic changes, and no LIVE charging gate changes.

---

## 2. Occurrence counts

| Scope | Before (approx.) | After (approx.) | Notes |
|-------|------------------|-----------------|-------|
| Entire repo (case-insensitive) | ~350+ file hits | ~350+ file hits | Mostly historical docs, migrations, dead `src/lib/fastspring/**`, internal field names |
| Active UI components (`src/components/**`) | ~93 string/code refs | ~93 code-identifier refs | **0 user-facing brand strings** (guarded by `scripts/legacy-billing-provider-removal.test.mjs`) |
| Operator diagnostics UI copy | ~45 visible strings | **0** legacy provider brand strings | Replaced with provider-neutral / Mollie-first labels |

---

## 3. Active UI remaining (legacy brand strings)

**Target: ZERO — ACHIEVED**

Guarded files (must not expose Stripe/Paddle/FastSpring in `title`/`label`/`description`/`message` literals):

- `src/components/settings/billing-diagnostics-panel.tsx`
- `src/components/settings/billing-maintenance-actions.tsx`
- `src/components/settings/billing-settings-panel.tsx`
- `src/components/settings/diagnostics-panel.tsx`
- `src/components/pricing/pricing-grid.tsx`
- `src/components/pricing/pricing-card.tsx`
- `src/components/billing/checkout-block-banner.tsx`
- `src/components/settings/invoice-center-panel.tsx`

Remaining matches in these files are **internal prop/field names** only (`stripeStatus`, `maskStripeId`, `stripe_customer_id` column reads).

**Dead but retained:** `src/components/settings/fastspring-test-checkout-panel.tsx` — not mounted; `/settings/billing/fastspring-test` redirects to Mollie test checkout.

---

## 4. Classification summary (Phase 1 inventory)

| Classification | Examples |
|----------------|----------|
| **USER_VISIBLE_ACTIVE → REMEDIATED** | Billing settings provider labels, maintenance action copy, diagnostics section titles |
| **OPERATOR_VISIBLE_ACTIVE → REMEDIATED** | Platform status tiles (FastSpring/Paddle removed), billing diagnostics panels, cleanup recommendations |
| **ACTIVE_RUNTIME_CODE (retained)** | `provider-selection.ts` FastSpring ownership (prevents double-billing historical orgs), Mollie checkout/webhook/sync |
| **ACTIVE_ENV** | `.env.example` — Mollie active; legacy vars commented LEGACY |
| **ACTIVE_DB_SCHEMA (retained)** | `stripe_*`, `paddle_*`, `fastspring_*` columns/tables — archive only |
| **HISTORICAL_DB_COMPAT** | `organization_subscriptions.billing_provider`, `stripe_webhook_events`, `paddle_webhook_events` |
| **HISTORICAL_MIGRATION** | `20250623290000_stripe_billing.sql`, `20250717000000_paddle_billing.sql`, `20250726120000_fastspring_webhook_foundation.sql` |
| **TEST_ONLY** | `scripts/fastspring-*.test.mjs`, `scripts/mollie-*.test.mjs`, new `scripts/legacy-billing-provider-removal.test.mjs` |
| **DOCUMENTATION_ONLY** | Build Bible chapters, mollie cutover reports, `docs/paddle-billing.md` |
| **DEPENDENCY** | No Paddle/Stripe SDKs in `package.json`; `@mollie/api-client` only |
| **DEAD_CODE** | `src/lib/fastspring/**`, `fastspring-test-checkout-panel.tsx`, 410 stub routes under `/api/fastspring/*` |

---

## 5. Files changed (this remediation)

| Area | Files |
|------|-------|
| Hygiene / false positives | `src/lib/billing/hygiene.ts` |
| Production diagnostics | `src/lib/billing/production-diagnostics.ts` |
| Cleanup recommendations | `src/lib/billing/cleanup-recommendations.ts` |
| Active billing comments | `src/lib/billing/active-billing.ts` |
| Platform status / health | `src/lib/diagnostics/platform-status.ts`, `src/lib/diagnostics/platform-health.ts` |
| Settings UI | `billing-diagnostics-panel.tsx`, `billing-maintenance-actions.tsx`, `billing-settings-panel.tsx`, `diagnostics-panel.tsx`, `checkout-block-banner.tsx` |
| API stubs | `src/app/api/fastspring/webhook/route.ts`, `src/app/api/fastspring/connectivity/route.ts` |
| Tests | `scripts/legacy-billing-provider-removal.test.mjs`, `scripts/mollie-sole-provider.test.mjs`, `package.json` |
| Docs | `docs/legacy-billing-provider-removal-final.md` (this file) |

---

## 6. Routes

| Route | Status |
|-------|--------|
| `/api/mollie/webhook` | **Active** |
| `/api/mollie/connectivity` | **Active** |
| `/api/fastspring/webhook` | **410 Gone** — provider-neutral message |
| `/api/fastspring/connectivity` | **410 Gone** — provider-neutral message |
| `/settings/billing/fastspring-test` | **Redirect** → `/settings/billing/mollie-test` |
| `/settings/billing/mollie-test` | **Active** operator test surface |

No `/api/paddle/*` or `/api/stripe/*` routes exist.

---

## 7. Dependencies removed

None in this pass — Paddle/Stripe SDKs were already absent. Confirmed: no `@paddle/*` packages.

---

## 8. Environment variables — operator cleanup list

### REMOVE NOW (Vercel / hosting — unused at runtime)

- `FASTSPRING_WEBHOOK_SECRET`
- `FASTSPRING_API_USERNAME`
- `FASTSPRING_API_PASSWORD`
- `FASTSPRING_STOREFRONT`
- `FASTSPRING_STORE_ID`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_*` (any historical Stripe keys)
- `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `PADDLE_ENVIRONMENT`, `PADDLE_PRICE_*`
- `BILLING_PROVIDER` (not a runtime switch)

### KEEP (active)

- `MOLLIE_API_KEY`
- `MOLLIE_BILLING_ROLLOUT`
- `MOLLIE_BILLING_ORG_ALLOWLIST` (optional)
- `MOLLIE_BILLING_DEFAULT_FOR_NEW` (diagnostics)
- `MOLLIE_LIVE_CHARGING_ENABLED` — **do not enable until explicit go-live approval**

### REVIEW (non-billing)

- Standard Supabase, cron, email, observability vars — unchanged

---

## 9. DB fields retained (read-only archive)

| Table / column | Purpose |
|----------------|---------|
| `organization_subscriptions.stripe_customer_id` | Legacy customer reference archive |
| `organization_subscriptions.stripe_subscription_id` | Legacy subscription reference archive |
| `organization_subscriptions.stripe_price_id` | Legacy price reference archive |
| `organization_subscriptions.provider_*` | Active Mollie (and historical FS/Paddle) references |
| `organization_subscriptions.billing_provider` | Row provenance (`mollie`, `fastspring`, `paddle`, `stripe`) |
| `stripe_webhook_events` | Pre-migration webhook archive |
| `paddle_webhook_events` | Paddle webhook archive |
| `fastspring_webhook_events` | FastSpring webhook archive |
| `customer_invoices.stripe_invoice_id` | Legacy invoice id archive |

**No migrations executed.** No column drops.

---

## 10. Diagnostics / Mollie regression

- Mollie subscriptions no longer flagged for missing `stripe_customer_id` / `stripe_subscription_id`
- Production diagnostics use `hasMollieSubscriptionId`, `mollieCheckoutBlocked`
- Platform status shows **Mollie API** + **Legacy billing archive** (not FastSpring/Paddle tiles)
- `checkMollieApiConfigHealth()` drives `stripeConnected` / `stripeHealth` legacy snapshot fields

---

## 11. Auth cookie RSC fix

**Intact** — verified by `scripts/auth-session-cookie-rsc.test.mjs` (6/6 pass).

---

## 12. Sentry / PostHog EU / CSP

**Unchanged** — no modifications to observability or CSP in this pass.

---

## 13. Quality gates

| Gate | Result |
|------|--------|
| `npm run lint` | PASS (pre-existing warnings only) |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run test:legacy-billing-removal` | PASS (11/11) |
| `npm run test:auth-session-cookies` | PASS (6/6) |
| `npm run test:production-readiness` | PASS (17/17) |
| `scripts/mollie-sole-provider.test.mjs` | PASS (12/12) |

---

## 14. Operator actions

1. Remove legacy env vars listed in §8 from Vercel Production/Preview/Development.
2. Confirm Mollie webhook URL: `https://<domain>/api/mollie/webhook`.
3. Remove any FastSpring/Paddle/Stripe dashboard webhook URLs pointing at this app.
4. Review billing diagnostics for orgs with historical `billing_provider != mollie` — support path only.
5. Do **not** enable `MOLLIE_LIVE_CHARGING_ENABLED` until release board sign-off.

---

## 15. Risks

| Risk | Mitigation |
|------|------------|
| Historical FastSpring-owned orgs | `provider-selection.ts` still routes ownership to existing FS rows — prevents double Mollie billing |
| Dead `src/lib/fastspring/**` code | Not mounted in UI; 410 on webhooks; future chapter may delete |
| Internal `stripe*` field aliases in diagnostics snapshots | Documented; map to Mollie health — rename is non-blocking debt |
| `fastspring-test-checkout-panel.tsx` dead component | Redirect guard + test; safe to delete in a later debt pass |

---

## 16. Remaining occurrences (justified)

All remaining repo matches fall into: historical migrations, archival documentation, dead FastSpring module, internal TypeScript identifiers (`stripeStatus`, DB column names), analytics redaction keys, and regression tests asserting retirement.

**PASS criteria met:**

- Zero Stripe/Paddle/FastSpring in user/operator visible UI copy
- Mollie sole active provider
- Mollie health does not require legacy Stripe IDs
- Historical data preserved
- LIVE charging unchanged
- Auth cookie fix intact
