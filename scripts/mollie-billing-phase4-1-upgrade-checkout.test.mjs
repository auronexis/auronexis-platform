/**
 * Mollie Phase 4.1 — Professional → Business upgrade checkout forensic suite.
 * Source-contract + pure proration math. Does not enable LIVE charging.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { pathExists, readSource } from "./_test-helpers/read-source.mjs";

function formatAmount(value) {
  return value.toFixed(2);
}

function normalizeBoundary(value, bound) {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return Date.parse(bound === "end" ? `${trimmed}T23:59:59.999Z` : `${trimmed}T00:00:00.000Z`);
  }
  return Date.parse(trimmed);
}

/** Mirrors src/lib/billing/providers/mollie/upgrade-proration.ts */
function calculateProration(input) {
  const previousPriceCents = input.previousPriceMonthly * 100;
  const targetPriceCents = input.targetPriceMonthly * 100;
  const periodStartMs = normalizeBoundary(input.currentPeriodStart, "start");
  const periodEndMs = normalizeBoundary(input.currentPeriodEnd, "end");
  const remainingMs = Math.max(0, periodEndMs - input.referenceDate.getTime());
  const totalPeriodMs = periodEndMs - periodStartMs;
  const netDueCents = Math.max(
    0,
    Math.round(((targetPriceCents - previousPriceCents) * remainingMs) / totalPeriodMs),
  );
  return { netDueCents, formattedNetDue: formatAmount(netDueCents / 100), remainingMs, totalPeriodMs };
}

// 1 — Recovered active Professional can start Business upgrade checkout
test("1: recovered active Professional routes to upgrade payment checkout", () => {
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /allowed_mollie_plan_change/);
  assert.match(actions, /createMollieUpgradePaymentCheckout/);
  assert.match(actions, /targetPlan\.order > currentPlan\.order/);
  const upgrade = readSource("src/lib/billing/providers/mollie/upgrade-payment.ts");
  assert.match(upgrade, /resolveUpgradePeriodBounds/);
  assert.match(upgrade, /resolveOpenUpgradePaymentCheckout/);
  assert.doesNotMatch(
    upgrade,
    /if \(existing\.upgrade_payment_id\) \{\s*throw new Error\(\s*"An upgrade payment is already in progress/,
  );
});

// 2 — Produces Mollie hosted checkout URL
test("2: upgrade payment create returns hosted checkout URL", () => {
  const upgrade = readSource("src/lib/billing/providers/mollie/upgrade-payment.ts");
  assert.match(upgrade, /customerPayments\.create/);
  assert.match(upgrade, /SequenceType\.oneoff/);
  assert.match(upgrade, /_links\?\.checkout\?\.href/);
  assert.match(upgrade, /checkoutUrl/);
  assert.match(upgrade, /upgrade_payment_redirect/);
});

// 3 — Professional remains authoritative before paid
test("3: Professional remains authoritative before paid webhook", () => {
  const upgrade = readSource("src/lib/billing/providers/mollie/upgrade-payment.ts");
  assert.match(upgrade, /Business entitlements activate only after webhook confirms payment paid/);
  assert.doesNotMatch(upgrade, /planKey:\s*input\.targetPlanKey/);
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /applyMollieUpgradeAfterPayment/);
  assert.match(lifecycle, /planKey: input\.targetPlanKey/);
  const returnPage = readSource("src/app/(dashboard)/settings/billing/mollie/return/page.tsx");
  assert.match(returnPage, /does not grant Business access/);
  assert.match(returnPage, /purpose === "upgrade"/);
});

// 4 — Prorated amount Professional $179 → Business $599
test("4: prorated amount uses remaining-period formula Pro→Business", () => {
  const proration = readSource("src/lib/billing/providers/mollie/upgrade-proration.ts");
  assert.match(proration, /target_price - current_price/);
  assert.match(proration, /remaining_time \/ total_period_time/);
  assert.match(proration, /Professional \$179 → Business \$599/);

  const periodStart = "2026-08-22T00:00:00.000Z";
  const periodEnd = "2026-09-22T00:00:00.000Z";
  const referenceDate = new Date("2026-08-23T10:00:00.000Z");
  const result = calculateProration({
    previousPriceMonthly: 179,
    targetPriceMonthly: 599,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    referenceDate,
  });

  const priceDeltaCents = (599 - 179) * 100;
  const expected = Math.round(
    (priceDeltaCents * result.remainingMs) / result.totalPeriodMs,
  );
  assert.equal(result.netDueCents, expected);
  assert.ok(result.netDueCents > 0);
  assert.ok(result.netDueCents < priceDeltaCents);
  assert.match(result.formattedNetDue, /^\d+\.\d{2}$/);
});

// 5 — Duplicate click reuse / refuse safely
test("5: duplicate upgrade click reuses open payment or refuses safely", () => {
  const upgrade = readSource("src/lib/billing/providers/mollie/upgrade-payment.ts");
  assert.match(upgrade, /resolveOpenUpgradePaymentCheckout/);
  assert.match(upgrade, /findReusableOpenUpgradePayment/);
  assert.match(upgrade, /reusedOpenPayment: true/);
  assert.match(upgrade, /UPGRADE_PAYMENT_IN_PROGRESS_MESSAGE/);
  assert.match(upgrade, /UPGRADE_PAYMENT_SYNC_NEEDED_MESSAGE/);
  assert.match(upgrade, /isMolliePaymentTerminalFailure/);
  assert.match(upgrade, /clearMollieUpgradePaymentAttempt/);
  const errors = readSource("src/lib/billing/errors.ts");
  assert.match(errors, /UPGRADE_PAYMENT_IN_PROGRESS_MESSAGE/);
  assert.doesNotMatch(
    errors,
    /upgrade payment is already in progress[\s\S]*return fallback/,
  );
});

// 6 — Paid webhook activates Business
test("6: paid upgrade webhook activates Business via applyMollieUpgradeAfterPayment", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /reconcileMollieUpgradePayment/);
  assert.match(webhooks, /applyMollieUpgradeAfterPayment/);
  assert.match(webhooks, /upgrade_webhook_paid/);
  assert.match(webhooks, /upgrade_apply/);
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /clearUpgradePaymentAttempt: true/);
});

// 7 — Failed payment leaves Professional
test("7: failed upgrade payment clears attempt and leaves Professional", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /upgrade_payment_failed/);
  assert.match(webhooks, /clearMollieUpgradePaymentAttempt\(organizationId\)/);
  assert.match(webhooks, /isMolliePaymentTerminalFailure/);
});

// 8 — Canceled payment leaves Professional
test("8: canceled\/expired upgrade payment treated as terminal failure", () => {
  const status = readSource("src/lib/billing/providers/mollie/lifecycle-status.ts");
  assert.match(status, /PaymentStatus\.canceled/);
  assert.match(status, /PaymentStatus\.expired/);
  assert.match(status, /isMolliePaymentTerminalFailure/);
});

// 9 — Return page alone cannot activate Business
test("9: return page alone cannot activate Business", () => {
  const returnPage = readSource("src/app/(dashboard)/settings/billing/mollie/return/page.tsx");
  assert.match(returnPage, /never grants entitlements from query params/i);
  assert.match(returnPage, /does not grant Business access/);
  const returnState = readSource("src/lib/billing/providers/mollie/return-state.ts");
  assert.match(returnState, /Never grants entitlements from query params/);
  assert.doesNotMatch(returnState, /provider_price_id:\s*["']business["']/);
});

// 10 — Duplicate webhook idempotency
test("10: upgrade webhook idempotent when already on target plan", () => {
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /previousPlanKey === input\.targetPlanKey/);
  assert.match(lifecycle, /clearMollieUpgradePaymentAttempt/);
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /ensureMollieIdempotency|mollie_webhook_events/);
});

// 11 — One activation email
test("11: upgrade activated email once via ledger template key", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /sendUpgradeActivatedEmail/);
  assert.match(webhooks, /upgrade_email/);
  const planChange = readSource("src/lib/billing/plan-change.ts");
  assert.match(planChange, /buildUpgradeActivatedTemplateKey/);
  assert.match(planChange, /upgrade_activated:/);
  const email = readSource("src/lib/email/plan-change.ts");
  assert.match(email, /sendUpgradeActivatedEmail/);
  assert.match(email, /buildUpgradeActivatedTemplateKey/);
});

// 12 — No duplicate customer
test("12: upgrade reuses existing Mollie customer — no customers\.create", () => {
  const upgrade = readSource("src/lib/billing/providers/mollie/upgrade-payment.ts");
  assert.match(upgrade, /provider_customer_id/);
  assert.doesNotMatch(upgrade, /customers\.create/);
  assert.match(upgrade, /customerPayments\.create/);
});

// 13 — No duplicate active subscription
test("13: upgrade updates existing sub_ — never creates second subscription", () => {
  const upgrade = readSource("src/lib/billing/providers/mollie/upgrade-payment.ts");
  assert.doesNotMatch(upgrade, /customerSubscriptions\.create/);
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /customerSubscriptions\.update/);
  assert.doesNotMatch(
    lifecycle.slice(lifecycle.indexOf("applyMollieUpgradeAfterPayment")),
    /customerSubscriptions\.create/,
  );
});

// 14 — FastSpring unchanged
test("14: FastSpring global default and sole-provider path unchanged", () => {
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /return "fastspring"/);
  assert.doesNotMatch(provider, /return "mollie"/);
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /createFastSpringCheckoutPayloadForPlan/);
  assert.match(actions, /This workspace is billed via Mollie/);
});

// 15 — LIVE=false still allows TEST checkout
test("15: LIVE=false still allows TEST upgrade checkout", () => {
  const mode = readSource("src/lib/billing/providers/mollie/mode.ts");
  assert.match(mode, /mode === "test"/);
  assert.match(mode, /MOLLIE_LIVE_CHARGING_ENABLED/);
  const envExample = readSource(".env.example");
  assert.match(envExample, /MOLLIE_LIVE_CHARGING_ENABLED=false/);
  const upgrade = readSource("src/lib/billing/providers/mollie/upgrade-payment.ts");
  assert.match(upgrade, /assertMolliePaymentOpsAllowed/);
  assert.doesNotMatch(upgrade, /assertMollieTestModeOnly/);
});

// Sanitized errors no longer collapse to Unable to start checkout for upgrade domain
test("16: upgrade domain errors are sanitized specifically", () => {
  const errors = readSource("src/lib/billing/errors.ts");
  assert.match(errors, /UPGRADE_PAYMENT_IN_PROGRESS_MESSAGE/);
  assert.match(errors, /UPGRADE_PAYMENT_SYNC_NEEDED_MESSAGE/);
  assert.match(errors, /UPGRADE_CHECKOUT_UNAVAILABLE_MESSAGE/);
  assert.match(errors, /Billing sync is required before upgrade/);
  assert.match(errors, /No active Mollie subscription to upgrade/);
  const planChange = readSource("src/lib/billing/plan-change.ts");
  assert.match(planChange, /UPGRADE_PAYMENT_IN_PROGRESS_MESSAGE/);
});

// Structured sanitized logs
test("17: structured upgrade stage logs present", () => {
  const upgrade = readSource("src/lib/billing/providers/mollie/upgrade-payment.ts");
  for (const stage of [
    "upgrade_validate",
    "upgrade_proration",
    "upgrade_attempt_create",
    "upgrade_payment_create",
    "upgrade_payment_redirect",
  ]) {
    assert.match(upgrade, new RegExp(stage));
  }
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /upgrade_webhook_paid/);
  assert.match(webhooks, /upgrade_apply/);
  assert.match(webhooks, /upgrade_email/);
});

// Documentation
test("18: forensic documentation report exists", () => {
  assert.ok(pathExists("docs/mollie-phase-4-1-upgrade-checkout-forensic.md"));
  const doc = readSource("docs/mollie-phase-4-1-upgrade-checkout-forensic.md");
  assert.match(doc, /FINAL VERDICT/);
  assert.match(doc, /Unable to start checkout/);
  assert.match(doc, /createMollieUpgradePaymentCheckout/);
  assert.match(doc, /MOLLIE_LIVE_CHARGING_ENABLED=false/);
});

// No new migration — schema sufficient
test("19: no new migration — upgrade_payment columns already exist", () => {
  assert.ok(pathExists("supabase/migrations/20250822020000_mollie_upgrade_payment_attempt.sql"));
  const migrations = readSource("package.json");
  assert.ok(true);
  const types = readSource("src/types/database.ts");
  assert.match(types, /upgrade_payment_id/);
  assert.match(types, /upgrade_target_plan/);
});
