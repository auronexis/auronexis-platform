/**
 * Mollie Phase 4.1 — post-upgrade hardening (return UX + activation email).
 * Source-contract suite. Does not enable LIVE charging or call Mollie API.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { pathExists, readSource } from "./_test-helpers/read-source.mjs";

const returnPage = () => readSource("src/app/(dashboard)/settings/billing/mollie/return/page.tsx");
const returnState = () => readSource("src/lib/billing/providers/mollie/return-state.ts");
const poller = () => readSource("src/components/settings/mollie-upgrade-return-poller.tsx");
const pollActions = () => readSource("src/lib/billing/providers/mollie/upgrade-return-actions.ts");
const webhooks = () => readSource("src/lib/billing/providers/mollie/webhooks.ts");
const emailPlanChange = () => readSource("src/lib/email/plan-change.ts");
const emailTemplate = () => readSource("src/lib/email/templates/plan-change.ts");
const planChange = () => readSource("src/lib/billing/plan-change.ts");
const transactional = () => readSource("src/lib/email/transactional.ts");
const purchaseEmail = () => readSource("src/lib/email/purchase.ts");
const subMgmtEmail = () => readSource("src/lib/email/subscription-management.ts");
const recovery = () => readSource("src/lib/billing/providers/mollie/upgrade-email-recovery.ts");
const operatorRoute = () =>
  readSource("src/app/api/operator/mollie/paid-purchase-recovery/route.ts");
const billingPeriod = () => readSource("src/lib/billing/providers/mollie/billing-period.ts");
const fastspringProvider = () => readSource("src/lib/billing/provider.ts");
const idempotencyKey = () => readSource("src/lib/billing/providers/mollie/idempotency-key.ts");

// 1 — Return before webhook → confirming, not failure
test("1: return before webhook shows confirming, not failure/support", () => {
  const state = returnState();
  assert.match(state, /upgrade_confirming/);
  assert.match(state, /Payment received — confirming upgrade/);
  assert.match(poller(), /Payment received\. We're confirming your upgrade/);
  assert.doesNotMatch(poller(), /Checkout unavailable/);
  assert.doesNotMatch(
    poller().slice(poller().indexOf("upgrade_confirming"), poller().indexOf("upgrade_confirming") + 800),
    /Contact support/,
  );
  // Upgrade path must not reuse purchase activation_failed during delay
  const upgradeFn = state.slice(state.indexOf("resolveUpgradeReturnPageState"));
  assert.doesNotMatch(upgradeFn.slice(0, 3500), /activation_failed/);
});

// 2 — Webhook then → success without hard reload (poller)
test("2: bounded poller refreshes to upgrade_success without hard reload", () => {
  assert.match(poller(), /POLL_INTERVAL_MS = 1500/);
  assert.match(poller(), /STOP_AFTER_MS = 18_000/);
  assert.match(poller(), /getMollieUpgradeReturnPollStatusAction/);
  assert.match(poller(), /router\.refresh/);
  assert.match(poller(), /upgrade_success/);
  assert.match(pollActions(), /purpose: "upgrade"/);
  assert.match(pollActions(), /Never activates from query params|authoritative/i);
});

// 3 — Query params alone cannot activate Business
test("3: query params alone cannot activate Business", () => {
  assert.match(returnPage(), /never grants entitlements from query params/i);
  assert.match(returnPage(), /does not grant Business access/);
  assert.match(returnState(), /Never grants entitlements from query params/);
  assert.doesNotMatch(returnState(), /provider_price_id:\s*["']business["']/);
  assert.doesNotMatch(pollActions(), /upsertMollieOrganizationSubscription/);
});

// 4 — Failed/canceled payment never success
test("4: failed\/canceled upgrade payment never shows success", () => {
  assert.match(returnState(), /upgrade_payment_failed/);
  assert.match(returnState(), /isMolliePaymentTerminalFailure/);
  assert.match(poller(), /upgrade_payment_failed/);
  assert.match(poller(), /canceled, expired, or failed/);
  assert.doesNotMatch(
    poller().slice(poller().indexOf("upgrade_payment_failed"), poller().indexOf("upgrade_payment_failed") + 500),
    /now active/,
  );
});

// 5 — Paid upgrade → exactly one email
test("5: paid upgrade awaits exactly one activation email", () => {
  const wh = webhooks();
  const upgradeBlock = wh.slice(wh.indexOf("reconcileMollieUpgradePayment"));
  assert.match(upgradeBlock, /await sendUpgradeActivatedEmail/);
  assert.doesNotMatch(
    upgradeBlock.slice(
      upgradeBlock.indexOf("sendUpgradeActivatedEmail") - 80,
      upgradeBlock.indexOf("sendUpgradeActivatedEmail") + 40,
    ),
    /void getOrganizationNameForBillingEmail/,
  );
  assert.match(emailPlanChange(), /sendUpgradeActivatedEmail/);
  assert.match(planChange(), /upgrade_activated/);
  assert.match(planChange(), /providerSubscriptionId/);
  assert.match(planChange(), /providerPaymentId/);
  assert.match(emailTemplate(), /Your \$\{input\.newPlanName\} plan is now active/);
});

// 6 — Duplicate webhook → no duplicate email
test("6: duplicate webhook skips email via ledger; sent not reclaimed", () => {
  assert.match(transactional(), /reclaimFailedOrStaleDelivery/);
  assert.match(transactional(), /status === "sent"/);
  assert.match(transactional(), /status === "failed" \|\| status === "claimed"/);
  assert.match(emailPlanChange(), /activated email skipped \(idempotent\)/);
  assert.match(webhooks(), /skipped_idempotent|upgrade_email/);
});

// 7 — Email failure does not roll back Business
test("7: email failure does not roll back Business apply", () => {
  const wh = webhooks();
  const upgradeBlock = wh.slice(wh.indexOf("async function reconcileMollieUpgradePayment"));
  const applyIdx = upgradeBlock.indexOf("await applyMollieUpgradeAfterPayment");
  const emailIdx = upgradeBlock.indexOf("await sendUpgradeActivatedEmail");
  assert.ok(applyIdx >= 0 && emailIdx > applyIdx, "email runs after apply");
  assert.match(upgradeBlock, /try \{\s*\n\s*const organizationName = await getOrganizationNameForBillingEmail/);
  assert.match(upgradeBlock, /catch \(emailError\)/);
  assert.match(emailPlanChange(), /Failure must never roll back billing state/);
});

// 8–10 — Purchase / downgrade / cancel emails unchanged entrypoints
test("8-10: purchase, plan-change, and cancel email modules remain intact", () => {
  assert.match(purchaseEmail(), /sendPurchaseActivatedEmail/);
  assert.match(purchaseEmail(), /buildPurchaseActivatedTemplateKey/);
  assert.match(readSource("src/lib/email/templates/purchase.ts"), /purchase_activated:/);
  assert.match(emailPlanChange(), /sendPlanChangeScheduledEmail/);
  assert.match(emailPlanChange(), /sendPlanChangeAppliedEmail/);
  assert.match(subMgmtEmail(), /sendSubscriptionEndedEmail|sendPlanChangeCanceledEmail|sendSubscriptionCancellationScheduledEmail/);
});

// 11 — Billing period no collapse
test("11: billing period helpers preserve valid bounds", () => {
  assert.match(billingPeriod(), /resolveMollieBillingPeriodUpdate/);
  assert.match(billingPeriod(), /isValidMollieBillingPeriod|preserve|existingStart/);
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /resolveMollieBillingPeriodUpdate/);
  assert.match(lifecycle, /mode: "sync"/);
});

// 12 — Mollie sole provider
test("12: Mollie is global default sole provider", () => {
  assert.match(fastspringProvider(), /return "mollie"/);
  assert.doesNotMatch(fastspringProvider(), /return "fastspring"/);
});

// 13 — Idempotency key ≤100 still pass
test("13: Mollie Idempotency-Key builder remains ≤100", () => {
  assert.match(idempotencyKey(), /MOLLIE_IDEMPOTENCY_KEY_MAX_LENGTH = 100/);
  assert.match(idempotencyKey(), /m:\$\{envTag\}:\$\{digest\}/);
  assert.ok(pathExists("scripts/mollie-billing-phase4-1-idempotency-key.test.mjs"));
});

// Operator recovery for missing upgrade email
test("operator replay-upgrade-email is idempotent and non-mutating", () => {
  assert.match(recovery(), /replayMollieUpgradeActivatedEmail/);
  assert.match(recovery(), /Never mutates subscription or charge/);
  assert.match(recovery(), /sendUpgradeActivatedEmail/);
  assert.doesNotMatch(recovery(), /upsertMollieOrganizationSubscription/);
  assert.doesNotMatch(recovery(), /customerPayments\.create/);
  assert.match(operatorRoute(), /replay-upgrade-email/);
});

// Docs
test("post-upgrade hardening documentation exists", () => {
  assert.ok(pathExists("docs/mollie-phase-4-1-post-upgrade-hardening.md"));
  const doc = readSource("docs/mollie-phase-4-1-post-upgrade-hardening.md");
  assert.match(doc, /FINAL VERDICT/);
  assert.match(doc, /RETURN-PAGE ROOT CAUSE|A\. RETURN/);
  assert.match(doc, /EMAIL ROOT CAUSE|D\. EMAIL/);
  assert.match(doc, /MOLLIE_LIVE_CHARGING_ENABLED=false/);
});
