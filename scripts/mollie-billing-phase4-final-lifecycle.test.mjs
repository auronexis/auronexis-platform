/**
 * Mollie Phase 4 FINAL — renewal audit, period-end cancel safety,
 * cancellation withdrawal, payment-status paid-through fix.
 * Source-contract suite (tests 1–20).
 */
import assert from "node:assert/strict";
import test from "node:test";
import { pathExists, readSource } from "./_test-helpers/read-source.mjs";

test("1: Mollie production subscription uses 1 month interval (automatic renewal)", () => {
  const checkout = readSource("src/lib/billing/providers/mollie/production-checkout.ts");
  assert.match(checkout, /interval:\s*"1 month"/);
  assert.match(checkout, /customerSubscriptions\.create/);
  assert.match(checkout, /customerMandates\.page/);
});

test("2: renewal webhook advances period via resolveMollieBillingPeriodUpdate", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /classifyMollieProductionPayment/);
  assert.match(webhooks, /resolveMollieBillingPeriodUpdate/);
  assert.match(webhooks, /renewal/);
  assert.match(webhooks, /recordMolliePaidTransaction/);
});

test("3: Mollie suspended maps to past_due for failed renewal window", () => {
  const status = readSource("src/lib/billing/providers/mollie/lifecycle-status.ts");
  assert.match(status, /case "suspended"/);
  assert.match(status, /past_due/);
});

test("4: subscription cancel is immediate at Mollie and sets local cancel_at_period_end", () => {
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /customerSubscriptions\.cancel/);
  assert.match(lifecycle, /cancelAtPeriodEnd:\s*true/);
  assert.match(lifecycle, /Mollie API cancel is immediate/);
  assert.doesNotMatch(lifecycle, /mandates\.revoke|customers\.delete/);
});

test("5: paid-through usability preserves access until current_period_end", () => {
  const mgmt = readSource("src/lib/billing/subscription-management.ts");
  assert.match(mgmt, /isSubscriptionPaidThroughPeriodEnd/);
  assert.match(mgmt, /resolveSubscriptionUsability/);
  assert.match(mgmt, /cancel_at_period_end/);
  const status = readSource("src/lib/billing/providers/mollie/lifecycle-status.ts");
  assert.match(status, /resolveMollieStoredSubscriptionStatus/);
});

test("6: cancel prevents future Mollie charges (provider cancel; mandate kept)", () => {
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /customerSubscriptions\.cancel/);
  assert.match(lifecycle, /no future charges/);
  assert.match(lifecycle, /Mandates and customers are not revoked/);
});

test("7: finalizeMollieSubscriptionIfExpired ends paid-through access", () => {
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /finalizeMollieSubscriptionIfExpired/);
  assert.match(lifecycle, /normalizedStatus:\s*"canceled"/);
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /finalizeMollieSubscriptionIfExpired/);
});

test("8: Mollie same-sub reactivation unsupported; withdrawal recreate path exists", () => {
  const status = readSource("src/lib/billing/providers/mollie/lifecycle-status.ts");
  assert.match(status, /MOLLIE_SUPPORTS_SUBSCRIPTION_REACTIVATION\s*=\s*false/);
  assert.match(status, /withdrawMollieOrganizationSubscriptionCancellation/);
  assert.ok(pathExists("src/lib/billing/providers/mollie/cancellation-withdrawal.ts"));
  const withdraw = readSource("src/lib/billing/providers/mollie/cancellation-withdrawal.ts");
  assert.match(withdraw, /withdrawMollieOrganizationSubscriptionCancellation/);
  assert.match(withdraw, /startDate/);
  assert.match(withdraw, /mandateId/);
});

test("9: withdrawal recreates subscription with startDate = period end (no immediate charge)", () => {
  const withdraw = readSource("src/lib/billing/providers/mollie/cancellation-withdrawal.ts");
  assert.match(withdraw, /startDate/);
  assert.match(withdraw, /toMollieStartDate/);
  assert.match(withdraw, /immediateCharge:\s*false/);
  assert.match(withdraw, /current_period_end/);
  assert.doesNotMatch(withdraw, /sequenceType:\s*["']first["']/);
  assert.doesNotMatch(withdraw, /payments\.create/);
});

test("10: withdrawal clears cancel_at_period_end and preserves period end as renewal", () => {
  const withdraw = readSource("src/lib/billing/providers/mollie/cancellation-withdrawal.ts");
  assert.match(withdraw, /cancelAtPeriodEnd:\s*false/);
  assert.match(withdraw, /currentPeriodEnd:\s*periodEnd/);
  assert.match(withdraw, /normalizedStatus:\s*"active"/);
});

test("11: withdrawal reuses existing Mollie customer and mandate", () => {
  const withdraw = readSource("src/lib/billing/providers/mollie/cancellation-withdrawal.ts");
  assert.match(withdraw, /provider_customer_id/);
  assert.match(withdraw, /customerMandates\.page/);
  assert.match(withdraw, /mandateId:\s*usableMandate\.id/);
  assert.doesNotMatch(withdraw, /customers\.create/);
});

test("12: withdrawal is idempotent and adopts existing active replacement", () => {
  const withdraw = readSource("src/lib/billing/providers/mollie/cancellation-withdrawal.ts");
  assert.match(withdraw, /alreadyWithdrawn/);
  assert.match(withdraw, /customerSubscriptions\.page/);
  assert.match(withdraw, /activeReplacement/);
  assert.match(withdraw, /adopted existing active Mollie subscription/);
  assert.match(withdraw, /buildMollieIdempotencyKey/);
  assert.match(withdraw, /withdraw_cancel|withdraw:/);
});

test("13: withdrawal rejects after current_period_end", () => {
  const withdraw = readSource("src/lib/billing/providers/mollie/cancellation-withdrawal.ts");
  assert.match(withdraw, /SUBSCRIPTION_CANCELLATION_WITHDRAW_EXPIRED_MESSAGE/);
  assert.match(withdraw, /periodEndMs\s*<=\s*Date\.now\(\)/);
  const mgmt = readSource("src/lib/billing/subscription-management.ts");
  assert.match(mgmt, /SUBSCRIPTION_CANCELLATION_WITHDRAW_EXPIRED_MESSAGE/);
});

test("14: withdrawal email uses billing_system ledger with idempotent template key", () => {
  const email = readSource("src/lib/email/subscription-management.ts");
  assert.match(email, /sendSubscriptionCancellationWithdrawnEmail/);
  assert.match(email, /buildSubscriptionCancellationWithdrawnTemplateKey/);
  assert.match(email, /EMAIL_CATEGORIES\.BILLING_SYSTEM/);
  assert.match(email, /email skipped \(idempotent\)/);
  const templates = readSource("src/lib/email/templates/subscription-management.ts");
  assert.match(templates, /buildSubscriptionCancellationWithdrawnSubject/);
  assert.match(templates, /will continue/);
  assert.match(templates, /No charge today/);
});

test("15: withdrawal action fires email after success and isolates email failures", () => {
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /withdrawMollieSubscriptionCancellationAction/);
  assert.match(actions, /withdrawMollieOrganizationSubscriptionCancellation/);
  assert.match(actions, /void sendSubscriptionCancellationWithdrawnEmail/);
  assert.match(actions, /\[billing\]\[subscription-withdraw\] email failed/);
  const withdrawIdx = actions.indexOf("withdrawMollieOrganizationSubscriptionCancellation");
  const emailIdx = actions.indexOf("sendSubscriptionCancellationWithdrawnEmail", withdrawIdx);
  assert.ok(emailIdx > withdrawIdx, "email must run after successful withdraw");
});

test("16: payment status uses paid-through state instead of No payment on file", () => {
  const status = readSource("src/lib/billing/status.ts");
  assert.match(status, /paidThrough/);
  assert.match(status, /Paid through/);
  const types = readSource("src/lib/billing/types.ts");
  assert.match(types, /paidThrough:\s*subscriptionManagement\.isPaidThrough/);
  assert.match(types, /paidThroughLabel:\s*subscriptionManagement\.accessUntilLabel/);
  const panel = readSource("src/components/settings/billing-settings-panel.tsx");
  assert.match(panel, /paidThrough:\s*overview\.subscriptionManagement/);
});

test("17: upgrade, downgrade, and cancel schedule contracts preserved", () => {
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /scheduleMollieOrganizationDowngrade/);
  assert.match(lifecycle, /cancelMollieScheduledPlanChange/);
  assert.match(lifecycle, /cancelMollieOrganizationSubscription/);
  const upgrade = readSource("src/lib/billing/providers/mollie/upgrade-payment.ts");
  assert.match(upgrade, /createMollieUpgradePaymentCheckout/);
});

test("18: Mollie idempotency keys stay within 100-char limit helper", () => {
  const idem = readSource("src/lib/billing/providers/mollie/idempotency-key.ts");
  assert.match(idem, /MOLLIE_IDEMPOTENCY_KEY_MAX_LENGTH\s*=\s*100/);
  assert.match(idem, /buildMollieIdempotencyKey/);
  const withdraw = readSource("src/lib/billing/providers/mollie/cancellation-withdrawal.ts");
  assert.match(withdraw, /buildMollieIdempotencyKey/);
});

test("19: FastSpring coexistence and global provider remain intact", () => {
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /return "fastspring"/);
  const sync = readSource("src/lib/billing/providers/mollie/organization-sync.ts");
  assert.match(sync, /assertCanWriteMollieOrganizationSubscription/);
  assert.match(sync, /Refusing Mollie write/);
  const envExample = readSource(".env.example");
  assert.match(envExample, /MOLLIE_LIVE_CHARGING_ENABLED=false/);
});

test("20: billing UI exposes Keep subscription withdrawal modal", () => {
  const panel = readSource("src/components/settings/billing-mollie-management-panel.tsx");
  assert.match(panel, /withdrawMollieSubscriptionCancellationAction/);
  assert.match(panel, /canWithdrawCancellation/);
  assert.match(panel, /Keep subscription/);
  assert.match(panel, /Confirm keep subscription/);
  assert.match(panel, /No charge today/i);
  assert.match(panel, /withdrawDialogRef/);
  const mgmt = readSource("src/lib/billing/subscription-management.ts");
  assert.match(mgmt, /canWithdrawCancellation/);
  assert.ok(pathExists("docs/mollie-phase-4-final-lifecycle-hardening.md"));
});
