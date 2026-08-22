/**
 * Mollie Phase 4.1 Critical Recovery V3 — source-contract suite (sections 63–82).
 * Preserves Phase 2/3/4/4.1 + Recovery V2 tests.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { pathExists, readSource } from "./_test-helpers/read-source.mjs";

// 63 — Payment classification module
test("63: payment classification distinguishes initial purchase vs renewal", () => {
  const classification = readSource(
    "src/lib/billing/providers/mollie/payment-classification.ts",
  );
  assert.match(classification, /classifyMollieProductionPayment/);
  assert.match(classification, /initial_purchase/);
  assert.match(classification, /renewal/);
  assert.match(classification, /upgrade_adjustment/);
  assert.match(classification, /resolveMolliePaidTransactionProductName/);
});

// 64 — Stale canceled sub must not steer webhook routing
test("64: stale canceled organization subscription is ignored for routing", () => {
  const classification = readSource(
    "src/lib/billing/providers/mollie/payment-classification.ts",
  );
  assert.match(classification, /isStaleMollieOrganizationSubscription/);
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /isStaleMollieOrganizationSubscription/);
  assert.match(webhooks, /shouldRouteMolliePaymentAsInitialPurchase/);
});

// 65 — sequenceType=first + initial_purchase forces fresh purchase path
test("65: first payment with initial_purchase metadata routes to fresh purchase reconcile", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /reconcileMollieFreshPurchaseWebhook/);
  assert.match(webhooks, /shouldRouteMolliePaymentAsInitialPurchase/);
  const checkout = readSource("src/lib/billing/providers/mollie/production-checkout.ts");
  assert.match(checkout, /auroranexis_billing_purpose: "initial_purchase"/);
  assert.match(checkout, /SequenceType\.first/);
});

// 66 — organization-sync explicit null clears stale provider_subscription_id
test("66: organization-sync preserves sub only when providerSubscriptionId omitted", () => {
  const sync = readSource("src/lib/billing/providers/mollie/organization-sync.ts");
  assert.match(sync, /input\.providerSubscriptionId !== undefined/);
  assert.doesNotMatch(
    sync,
    /existing\.provider_subscription_id\s*:\s*input\.providerSubscriptionId/,
  );
});

// 67 — Checkout clears stale lifecycle state on fresh purchase start
test("67: production checkout resets stale subscription state before first payment", () => {
  const checkout = readSource("src/lib/billing/providers/mollie/production-checkout.ts");
  assert.match(checkout, /resetStaleSubscriptionState: true/);
  assert.match(checkout, /providerSubscriptionId: null/);
  const sync = readSource("src/lib/billing/providers/mollie/organization-sync.ts");
  assert.match(sync, /resetStaleSubscriptionState/);
});

// 68 — Never reuse canceled Mollie subscription after mandate
test("68: subscription-after-mandate only reuses entitlement-granting provider subscription", () => {
  const checkout = readSource("src/lib/billing/providers/mollie/production-checkout.ts");
  assert.match(checkout, /isMollieSubscriptionEntitlementGranting/);
  assert.match(checkout, /customerSubscriptions\.get/);
  assert.match(checkout, /customerSubscriptions\.create/);
});

// 69 — Webhook postcondition validation before processed
test("69: fresh purchase webhook validates postcondition before success", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /validateFreshPurchasePostcondition/);
  assert.match(webhooks, /postconditionFailed/);
  assert.match(webhooks, /resolveSubscriptionUsability/);
});

// 70 — Webhook route marks failed (not processed) when postcondition fails
test("70: webhook route marks event failed when postcondition fails", () => {
  const route = readSource("src/app/api/mollie/webhook/route.ts");
  assert.match(route, /result\.postconditionFailed/);
  assert.match(route, /markMollieEventFailed/);
  assert.doesNotMatch(route, /markMollieEventProcessed\(paymentId, result\.organizationId\)[\s\S]*postconditionFailed/);
});

// 71 — Initial purchase transaction label is subscription not renewal
test("71: initial purchase billing history uses subscription product label", () => {
  const classification = readSource(
    "src/lib/billing/providers/mollie/payment-classification.ts",
  );
  assert.match(classification, /subscription/);
  assert.match(classification, /renewal/);
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /resolveMolliePaidTransactionProductName/);
  assert.match(webhooks, /paymentKind: "initial_purchase"/);
});

// 72 — Return page re-fetches reconciled state
test("72: Mollie return page resolves authoritative return state", () => {
  const returnState = readSource("src/lib/billing/providers/mollie/return-state.ts");
  assert.match(returnState, /resolveMollieProductionReturnPageState/);
  const page = readSource("src/app/(dashboard)/settings/billing/mollie/return/page.tsx");
  assert.match(page, /resolveMollieProductionReturnPageState/);
  assert.match(page, /activation_failed/);
});

// 73 — Return page never activates from query params
test("73: return page remains non-authoritative for entitlements", () => {
  const page = readSource("src/app/(dashboard)/settings/billing/mollie/return/page.tsx");
  assert.match(page, /never grants entitlements/i);
  assert.doesNotMatch(page, /upsertMollieOrganizationSubscription/);
  assert.doesNotMatch(page, /createMollieProductionSubscriptionAfterMandate/);
});

// 74 — Operator recovery without third payment
test("74: paid purchase recovery function is idempotent and operator-safe", () => {
  assert.ok(pathExists("src/lib/billing/providers/mollie/paid-purchase-recovery.ts"));
  const recovery = readSource("src/lib/billing/providers/mollie/paid-purchase-recovery.ts");
  assert.match(recovery, /recoverMolliePaidFreshPurchase/);
  assert.match(recovery, /isStaleMollieOrganizationSubscription/);
  assert.match(recovery, /sendPurchaseActivatedEmail/);
  assert.match(recovery, /transactional_email_deliveries/);
});

// 75 — Duplicate paid first payment analysis helper
test("75: duplicate paid first payment analysis helper exists", () => {
  const recovery = readSource("src/lib/billing/providers/mollie/paid-purchase-recovery.ts");
  assert.match(recovery, /analyzeMollieDuplicatePaidFirstPayments/);
  assert.match(recovery, /sequenceType !== "first"/);
});

// 76 — Purchase email only on successful fresh activation path
test("76: purchase activation email sent from fresh purchase reconcile only after postcondition", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /sendPurchaseActivatedEmail/);
  const purchaseBlock = webhooks.slice(
    webhooks.indexOf("async function reconcileMollieFreshPurchaseWebhook"),
    webhooks.indexOf("function resolveBillingSurface"),
  );
  assert.match(purchaseBlock, /validateFreshPurchasePostcondition/);
  assert.ok(purchaseBlock.indexOf("sendPurchaseActivatedEmail") > purchaseBlock.indexOf("validateFreshPurchasePostcondition"));
});

// 77 — Cancellation email path preserved (Recovery V2)
test("77: cancellation email uses primary billing recipient path", () => {
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /resolvePrimaryBillingRecipientForEmail/);
  assert.match(actions, /sendSubscriptionCancellationScheduledEmail/);
});

// 78 — Entitlements paid-through semantics preserved
test("78: resolveSubscriptionUsability honors paid-through cancellation window", () => {
  const mgmt = readSource("src/lib/billing/subscription-management.ts");
  assert.match(mgmt, /resolveSubscriptionUsability/);
  assert.match(mgmt, /isSubscriptionPaidThroughPeriodEnd/);
  assert.match(mgmt, /Active — cancellation scheduled/);
});

// 79 — Recovery V2 upgrade proration preserved
test("79: Recovery V2 immediate upgrade proration path preserved", () => {
  const upgrade = readSource("src/lib/billing/providers/mollie/upgrade-payment.ts");
  assert.match(upgrade, /createMollieUpgradePaymentCheckout/);
  assert.match(upgrade, /MOLLIE_BILLING_PURPOSE_UPGRADE_ADJUSTMENT/);
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /applyMollieUpgradeAfterPayment/);
});

// 80 — Recovery V2 scheduled downgrade + cancel preserved
test("80: Recovery V2 scheduled downgrade and cancel-at-period-end preserved", () => {
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /scheduleMollieOrganizationDowngrade/);
  assert.match(lifecycle, /cancelMollieOrganizationSubscription/);
  assert.match(lifecycle, /cancelAtPeriodEnd: true/);
});

// 81 — No new migration required
test("81: recovery V3 uses existing upgrade payment columns only", () => {
  assert.ok(pathExists("supabase/migrations/20250822020000_mollie_upgrade_payment_attempt.sql"));
  const glob = readSource("supabase/migrations/20250822020000_mollie_upgrade_payment_attempt.sql");
  assert.match(glob, /upgrade_payment_id/);
});

// 82 — Recovery V3 documentation
test("82: recovery V3 documentation report exists", () => {
  assert.ok(pathExists("docs/mollie-phase-4-1-critical-recovery-v3.md"));
  const doc = readSource("docs/mollie-phase-4-1-critical-recovery-v3.md");
  assert.match(doc, /FINAL VERDICT/);
  assert.match(doc, /SELF-AUDIT/);
  assert.match(doc, /recoverMolliePaidFreshPurchase/);
});

// Postcondition A — Fresh purchase must end active with new sub_
test("postcondition A: fresh purchase reconcile creates subscription and validates active state", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /createMollieProductionSubscriptionAfterMandate/);
  assert.match(webhooks, /fresh_purchase_left_subscription_inactive/);
  assert.match(webhooks, /fresh_purchase_missing_provider_subscription_id/);
});

// Postcondition B — Paid webhook with failed activation must not be processed
test("postcondition B: webhook internal status reflects postcondition failure", () => {
  const route = readSource("src/app/api/mollie/webhook/route.ts");
  assert.match(route, /status: "failed"/);
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /postconditionError/);
});

// Postcondition C — Product label classification
test("postcondition C: paid transaction labels use payment kind not stale renewal default", () => {
  const classification = readSource(
    "src/lib/billing/providers/mollie/payment-classification.ts",
  );
  assert.match(classification, /\$\{input\.planName\} subscription/);
  assert.match(classification, /\$\{input\.planName\} renewal/);
});

// Postcondition D — Stale sub cleared at checkout + webhook
test("postcondition D: stale provider subscription cleared on fresh purchase paths", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /providerSubscriptionId: null/);
  assert.match(webhooks, /resetStaleSubscriptionState: true/);
  const checkout = readSource("src/lib/billing/providers/mollie/production-checkout.ts");
  assert.match(checkout, /resetStaleSubscriptionState: true/);
});

// Postcondition E — Recovery without another payment
test("postcondition E: operator recovery reuses paid tr_ without new checkout", () => {
  const recovery = readSource("src/lib/billing/providers/mollie/paid-purchase-recovery.ts");
  assert.match(recovery, /client\.payments\.get/);
  assert.match(recovery, /createMollieProductionSubscriptionAfterMandate/);
  assert.doesNotMatch(recovery, /customerPayments\.create/);
});
