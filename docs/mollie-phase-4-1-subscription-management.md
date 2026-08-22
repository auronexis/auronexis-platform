# Mollie Phase 4.1 — Subscription Management & Cancellation Lifecycle

**Status:** Implemented at HEAD  
**Scope:** Cancel scheduled plan change, cancel-at-period-end subscription lifecycle, paid-through entitlements, transactional email, UI, webhook expiry, FastSpring coexistence.

---

## A — Cancel scheduled plan change

| Step | Implementation |
|------|----------------|
| Authorize | `canManageOrganizationSettings` in server actions |
| Load subscription | `getMollieOrganizationSubscription` |
| Validate pending | Reject when `pending_plan` is null (idempotent message) |
| Re-fetch Mollie | `customerSubscriptions.get` |
| Restore provider config | `customerSubscriptions.update` with authoritative `provider_price_id` amount |
| Verify | `verifyMollieSubscriptionAmount` — failure keeps pending |
| Clear pending | `upsertMollieOrganizationSubscription({ clearPendingPlanChange: true })` |
| Email | `plan_change_canceled:{sub}:{pending_plan}` via `billing_system` ledger |

**Customer success:** `Scheduled downgrade canceled. Your Business plan will continue unchanged.`

**Idempotent:** `Scheduled plan change has already been canceled.`

---

## B — Cancel entire subscription

- Separate action from plan-change cancel (`cancelMollieOrganizationSubscription`).
- Mollie `customerSubscriptions.cancel` — does not revoke mandate or delete customer.
- Local `cancel_at_period_end = true`, `status` remains `active` until `current_period_end`.
- Clears pending plan change (no Professional activation at period end).
- Email: `subscription_cancellation_scheduled:{sub}:{access_until}`.

**UI:** Active — cancellation scheduled · Access until · Renewal: Canceled.

---

## C — Resume subscription

**NOT SUPPORTED.** Mollie has no reactivate API (`MOLLIE_SUPPORTS_SUBSCRIPTION_REACTIVATION = false`). Recovery requires new first-payment checkout with duplicate-subscription safeguards.

---

## D — Architecture audit

| Surface | Location |
|---------|----------|
| Pending plan | `organization_subscriptions.pending_plan*` |
| Cancel at period end | `cancel_at_period_end`, `current_period_end` |
| Paid-through usability | `subscription-management.ts`, `active-billing.ts` |
| Mollie stored status | `resolveMollieStoredSubscriptionStatus` |
| FastSpring reference | `fastspring/webhooks.ts` cancelAtPeriodEnd on `subscription.canceled` |
| Email idempotency | `transactional_email_deliveries` UNIQUE `(user_id, template_key)` |

---

## E — Centralized view model

- `src/lib/billing/subscription-management.ts` — paid-through, management state, email template keys, success copy.
- `buildBillingOverview()` — `subscriptionManagement` on `BillingOverview`.
- `resolveScheduledPlanChange` unchanged in `plan-change.ts`.

---

## F — Entitlements

`resolveSubscriptionUsability` grants paid access when `cancel_at_period_end` and before `current_period_end`, even if Mollie `provider_status` is `canceled`.

`applyMolliePendingPlanChangeIfReady` skips when `cancel_at_period_end`.

---

## G — Webhook / reconciliation

After paid webhook sync:

1. `resolveMollieStoredSubscriptionStatus` for normalized status.
2. `finalizeMollieSubscriptionIfExpired` when paid-through window ends.
3. `subscription_ended` email (idempotent).

Logging: `[billing][subscription-expire]`.

---

## H — RBAC & security

- Owner/admin only (`canManageOrganizationSettings`).
- Organization scoped from session context in server actions.
- Cross-org writes refused via subscription row ownership checks.

---

## I — UI (`/settings/billing`)

`BillingMollieManagementPanel`:

- Current subscription card (plan, price, status, renewal, Manage plan link).
- Scheduled plan change section with confirmation modal + cancel button.
- Subscription section with cancel confirmation modal (danger confirm).
- Green success alerts; destructive confirm styling on subscription cancel.

`/settings/plans`: warning when cancellation scheduled; plan changes blocked.

---

## J — Emails

| Event | Template key prefix | Sender |
|-------|-------------------|--------|
| `plan_change_canceled` | `plan_change_canceled:` | Auroranexis Notifications `<noreply@auroranexis.com>` |
| `subscription_cancellation_scheduled` | `subscription_cancellation_scheduled:` | same |
| `subscription_ended` | `subscription_ended:` | same |

Email failure never rolls back billing state.

Templates: `src/lib/email/templates/subscription-management.ts`.

---

## K — Logging

| Tag | When |
|-----|------|
| `[billing][plan-change-cancel]` | Scheduled change canceled / rejected |
| `[billing][subscription-cancel]` | Cancellation scheduled |
| `[billing][subscription-expire]` | Paid-through access ended |
| `[billing][subscription-resume]` | Not used (resume unsupported) |

---

## L — Migration policy

**Migration required: NO**

`cancel_at_period_end` and `current_period_end` already exist on `organization_subscriptions`. Phase 4 migration `20250822010000_mollie_pending_plan_change.sql` remains sufficient.

---

## M — Phase 4 regression

| Contract | Status |
|----------|--------|
| `provider_price_id` authoritative until webhook apply | Preserved |
| Duplicate plan change messages | Preserved |
| `scheduleMolliePendingPlanChange` / `applyMolliePendingPlanChangeIfReady` | Preserved |
| FastSpring coexistence | Preserved |
| `MOLLIE_LIVE_CHARGING_ENABLED=false` | Preserved |
| Global provider `fastspring` | Preserved |

---

## N — TEST / LIVE safety

`MOLLIE_LIVE_CHARGING_ENABLED=false` in `.env.example` — not enabled by this work.

---

## O — Automated tests

- `scripts/mollie-billing-phase4-1.test.mjs` (A–R)
- Updated `scripts/mollie-billing-phase4.test.mjs` (J, F, S)
- `npm run test:mollie-billing` includes Phase 4.1 suite

---

## P — Manual test scenarios

1. **Cancel scheduled downgrade:** Business current, Professional pending → cancel → Business remains, green success, email once.
2. **Idempotent cancel change:** Repeat cancel → `Scheduled plan change has already been canceled.`
3. **Cancel subscription:** Active Business → cancel → access until period end, pending cleared, email once.
4. **Plans page:** Cancellation scheduled → downgrade blocked, warning banner.
5. **Expiry:** After `current_period_end` (webhook/reconcile) → access ends, `subscription_ended` email once.

---

## Q — Operator actions

One next step: verify cancel scheduled change and cancel subscription in Mollie TEST mode against a workspace with an active TEST subscription before enabling LIVE charging.

---

## R — Files changed (summary)

- `src/lib/billing/subscription-management.ts` (new)
- `src/lib/billing/providers/mollie/lifecycle.ts`
- `src/lib/billing/providers/mollie/lifecycle-status.ts`
- `src/lib/billing/providers/mollie/organization-sync.ts`
- `src/lib/billing/providers/mollie/webhooks.ts`
- `src/lib/billing/active-billing.ts`
- `src/lib/billing/types.ts`
- `src/lib/billing/actions.ts`
- `src/lib/billing/errors.ts`
- `src/lib/diagnostics/pricing-reasons.ts`
- `src/lib/email/subscription-management.ts` (new)
- `src/lib/email/templates/subscription-management.ts` (new)
- `src/components/settings/billing-mollie-management-panel.tsx` (new)
- `src/components/settings/billing-settings-panel.tsx`
- `src/components/pricing/pricing-grid.tsx`
- `scripts/mollie-billing-phase4-1.test.mjs` (new)
- `scripts/mollie-billing-phase4.test.mjs`
- `package.json`
- `docs/mollie-phase-4-1-subscription-management.md`

---

## S — Resume limitation detail

Mollie Subscriptions API cancel is immediate on the provider (no defer parameter). Auroranexis implements Stripe-style **paid-through** locally:

1. Call Mollie cancel (stops future charges).
2. Set `cancel_at_period_end = true`.
3. Keep normalized `status = active` until `current_period_end`.
4. Finalize to `canceled` via webhook reconciliation + `finalizeMollieSubscriptionIfExpired`.

Reactivation of a canceled Mollie subscription is **not** available — new checkout required.

---

## T — Verdict matrix

| Area | Grade |
|------|-------|
| Cancel scheduled change | A |
| Cancel subscription lifecycle | A |
| Entitlements paid-through | A |
| Email idempotency | A |
| UI / UX | A |
| Resume | Documented limitation |
| Migration | None required |
| Phase 4 plan change | Preserved |

---

## U — Idempotency surfaces

| Surface | Mechanism |
|---------|-----------|
| Cancel scheduled change | No `pending_plan` → already canceled message |
| Cancel subscription | `cancel_at_period_end` already set |
| Emails | `transactional_email_deliveries` |
| Webhook expiry | `finalizeMollieSubscriptionIfExpired` no-op when not expired |

---

## V — Concurrency

Provider verify-before-local-clear on plan-change cancel. Webhook reconciliation re-fetches authoritative Mollie state before writes.

---

## W — FastSpring coexistence

Unchanged. Mollie never overwrites FastSpring rows. FastSpring portal path unchanged.

---

## X — Global billing provider

`getActiveBillingProvider()` → `fastspring`. Mollie remains org-scoped ownership path.

---

## Y — FINAL VERDICT

**Grade: A — Production-ready for Mollie TEST validation**

Phase 4.1 completes self-serve subscription management for Mollie-owned workspaces: cancel scheduled plan changes with provider restore, cancel-at-period-end with truthful paid-through access, idempotent transactional email, and webhook-finalized expiry. Resume is not supported (Mollie API limitation). No schema migration required. Phase 4 plan-change behavior is preserved.

**Resume supported: NO** — Mollie API limitation; documented.

**Migration required: NO**

**Next operator action:** Run manual TEST scenarios P1–P5 on a Mollie TEST workspace before LIVE charging enablement.
