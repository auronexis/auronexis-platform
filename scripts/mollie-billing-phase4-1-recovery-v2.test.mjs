/**
 * Mollie Phase 4.1 Critical Recovery V2 — source-contract suite (sections 58–62).
 * Preserves Phase 2/3/4/4.1 tests.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { pathExists, readSource } from "./_test-helpers/read-source.mjs";

// 58 — Upgrade requires prorated payment before plan flip
test("58: upgrade uses dedicated prorated payment checkout", () => {
  const upgrade = readSource("src/lib/billing/providers/mollie/upgrade-payment.ts");
  assert.match(upgrade, /calculateMollieUpgradeProration/);
  assert.match(upgrade, /createMollieUpgradePaymentCheckout/);
  assert.match(upgrade, /MOLLIE_BILLING_PURPOSE_UPGRADE_ADJUSTMENT/);
  assert.match(upgrade, /SequenceType\.oneoff/);
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /applyMollieUpgradeAfterPayment/);
  assert.match(lifecycle, /scheduleMollieOrganizationDowngrade/);
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /createMollieUpgradePaymentCheckout/);
  assert.match(actions, /formatUpgradePaymentCheckoutMessage/);
});

// 59 — Cancellation paid-through semantics centralized
test("59: paid-through cancellation blocks premature inactive UI", () => {
  const checkout = readSource("src/lib/billing/checkout-eligibility.ts");
  assert.match(checkout, /resolveSubscriptionUsability/);
  const provider = readSource("src/lib/billing/provider-details.ts");
  assert.match(provider, /resolveSubscriptionManagementState/);
  const panel = readSource("src/components/settings/billing-mollie-management-panel.tsx");
  assert.match(panel, /cancelAtPeriodEnd && management\.isPaidThrough/);
  const sync = readSource("src/lib/billing/providers/mollie/organization-sync.ts");
  assert.match(sync, /resolveOrganizationPlanFlag/);
  assert.match(sync, /isSubscriptionPaidThroughPeriodEnd/);
});

// 60 — Cancellation email uses primary billing recipient + ledger
test("60: cancellation email persists via billing recipient + ledger", () => {
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /resolvePrimaryBillingRecipientForEmail/);
  assert.match(actions, /sendSubscriptionCancellationScheduledEmail/);
  const email = readSource("src/lib/email/subscription-management.ts");
  assert.match(email, /EMAIL_CATEGORIES\.BILLING_SYSTEM/);
  assert.match(email, /buildSubscriptionCancellationScheduledTemplateKey/);
});

// 61 — Initial purchase communication + billing history
test("61: purchase webhook writes billing history and activation email", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /recordMolliePaidTransaction/);
  assert.match(webhooks, /sendPurchaseActivatedEmail/);
  assert.match(webhooks, /upsertMollieBillingTransaction/);
  const purchase = readSource("src/lib/email/purchase.ts");
  assert.match(purchase, /sendPurchaseActivatedEmail/);
  assert.match(purchase, /buildPurchaseActivatedTemplateKey/);
  const checkout = readSource("src/lib/billing/providers/mollie/production-checkout.ts");
  assert.match(checkout, /initial_purchase/);
});

// 62 — Webhook routes upgrade_adjustment separately from renewal
test("62: webhook routes payment metadata by billing purpose", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /readBillingPurpose/);
  assert.match(webhooks, /reconcileMollieUpgradePayment/);
  assert.match(webhooks, /MOLLIE_BILLING_PURPOSE_UPGRADE_ADJUSTMENT/);
  assert.match(webhooks, /sendUpgradeActivatedEmail/);
});

// Migration for upgrade payment attempt
test("62b: upgrade payment attempt migration exists", () => {
  assert.ok(pathExists("supabase/migrations/20250822020000_mollie_upgrade_payment_attempt.sql"));
  const migration = readSource(
    "supabase/migrations/20250822020000_mollie_upgrade_payment_attempt.sql",
  );
  assert.match(migration, /upgrade_payment_id/);
  assert.match(migration, /upgrade_target_plan/);
});

// Recovery V2 documentation
test("62c: recovery V2 documentation report exists", () => {
  assert.ok(pathExists("docs/mollie-phase-4-1-critical-recovery-v2.md"));
  const doc = readSource("docs/mollie-phase-4-1-critical-recovery-v2.md");
  assert.match(doc, /FINAL VERDICT/);
  assert.match(doc, /SELF-AUDIT/);
  assert.match(doc, /upgrade_activated/);
  assert.match(doc, /purchase_activated/);
});
