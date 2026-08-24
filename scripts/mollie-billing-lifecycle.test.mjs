/**
 * Mollie Phase 2 TEST subscription lifecycle regression suite.
 * Source-contract style — does not import server-only modules at runtime.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource, pathExists } from "./_test-helpers/read-source.mjs";

test("getActiveBillingProvider returns mollie — sole active provider", () => {
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /return "mollie"/);
  assert.doesNotMatch(provider, /return "fastspring"/);
});

test("getMollieCredentialMode and assertMollieTestModeOnly fail closed", () => {
  const mode = readSource("src/lib/billing/providers/mollie/mode.ts");
  assert.match(mode, /export function getMollieCredentialMode/);
  assert.match(mode, /export function assertMollieTestModeOnly/);
  assert.match(mode, /mode !== "test"/);
  assert.match(mode, /Live, unknown, or missing keys are rejected/);
});

test("All Mollie TEST write modules call assertMollieTestModeOnly before API writes", () => {
  for (const file of [
    "src/lib/billing/providers/mollie/customer.ts",
    "src/lib/billing/providers/mollie/checkout.ts",
  ]) {
    const src = readSource(file);
    assert.match(src, /assertMollieTestModeOnly/, `${file} must enforce TEST mode`);
  }
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /assertMollieTestModeOnly/);
  assert.match(webhooks, /assertMolliePaymentOpsAllowed/);
});

test("getOrCreateMollieCustomer is idempotent via provider_customer_id", () => {
  const customer = readSource("src/lib/billing/providers/mollie/customer.ts");
  assert.match(customer, /getOrCreateMollieCustomer/);
  assert.match(customer, /provider_customer_id/);
  assert.match(customer, /startsWith\("cst_"\)/);
  assert.match(customer, /MOLLIE_METADATA_ORGANIZATION_ID/);
});

test("First payment uses sequenceType first and canonical plan pricing", () => {
  const checkout = readSource("src/lib/billing/providers/mollie/checkout.ts");
  assert.match(checkout, /SequenceType\.first/);
  assert.match(checkout, /getPlanByKey/);
  assert.match(checkout, /webhookUrl/);
  assert.match(checkout, /redirectUrl/);
  assert.match(checkout, /MOLLIE_METADATA_ORGANIZATION_ID/);
  assert.match(checkout, /auroranexis_billing_purpose.*first_payment/);
  assert.match(checkout, /idempotencyKey/);
});

test("Enterprise excluded from Mollie self-serve checkout", () => {
  const checkout = readSource("src/lib/billing/providers/mollie/checkout.ts");
  assert.match(checkout, /MOLLIE_SELF_SERVE_PLAN_KEYS = \["professional", "business"\]/);
  const actions = readSource("src/lib/billing/providers/mollie/test-checkout-actions.ts");
  assert.match(actions, /Enterprise is manual-only/);
});

test("Payment status mapping — only paid proceeds; pending/failed rejected", () => {
  const statusMap = readSource("src/lib/billing/providers/mollie/lifecycle-status.ts");
  assert.match(statusMap, /isMolliePaymentPaid/);
  assert.match(statusMap, /PaymentStatus\.paid/);
  assert.match(statusMap, /isMolliePaymentPending/);
  assert.match(statusMap, /isMolliePaymentTerminalFailure/);
  const checkout = readSource("src/lib/billing/providers/mollie/checkout.ts");
  assert.match(checkout, /isMolliePaymentPaid/);
  assert.match(checkout, /lifecycle-status/);
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /isMolliePaymentPaid/);
  assert.match(webhooks, /payment_pending/);
  assert.match(webhooks, /payment_failed/);
});

test("Mollie webhook route exists — public, re-fetch, idempotency", () => {
  const route = readSource("src/app/api/mollie/webhook/route.ts");
  assert.match(route, /reconcileMolliePaymentWebhook/);
  assert.match(route, /ensureMollieIdempotency/);
  assert.match(route, /extractMollieWebhookPaymentId/);
  assert.match(route, /MOLLIE_LIVE_CHARGING_ENABLED|credentialMode === "live"/);
  assert.doesNotMatch(route, /requireSession/);
  assert.doesNotMatch(route, /verifyCronAuthorization/);
});

test("Webhook reconciliation uses authoritative API re-fetch", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /client\.payments\.get/);
  assert.match(webhooks, /Never trust webhook body alone/);
  assert.match(webhooks, /customer_ownership_mismatch/);
});

test("Mollie idempotency ledger mirrors fastspring pattern", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /mollie_webhook_events/);
  assert.match(webhooks, /payload_hash/);
  assert.match(webhooks, /23505/);
  const migration = readSource("supabase/migrations/20250820000000_mollie_test_subscription_lifecycle.sql");
  assert.match(migration, /mollie_webhook_events/);
  assert.match(migration, /mollie_webhook_events_provider_event_unique/);
});

test("Subscription created after mandate verification", () => {
  const checkout = readSource("src/lib/billing/providers/mollie/checkout.ts");
  assert.match(checkout, /createMollieSubscriptionAfterMandate/);
  assert.match(checkout, /customerMandates\.page/);
  assert.match(checkout, /mandate\.status === "valid"/);
  assert.match(checkout, /No usable Mollie mandate/);
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /createMollieSubscriptionAfterMandate/);
});

test("Recurring payment reconciliation via payment.subscriptionId", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /payment\.subscriptionId/);
  assert.match(webhooks, /customerSubscriptions\.get/);
});

test("sync_pending cleared when subscription already mapped on reconcile", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  // Authoritative success path must clear pending (subscription id from payment OR local row).
  assert.match(webhooks, /existingSubscriptionId/);
  assert.match(webhooks, /sync_pending:\s*false/);
  // Paid first payment without subscription remains transient pending until create.
  assert.match(webhooks, /sync_pending:\s*true/);
  assert.match(webhooks, /createMollieSubscriptionAfterMandate/);
  // Must not leave paid+active+sync_pending after skipping create when sub already exists.
  assert.doesNotMatch(
    webhooks,
    /if\s*\(\s*!testRow\?\.provider_subscription_id\s*\)\s*\{[\s\S]*createMollieSubscriptionAfterMandate/,
  );
});

test("Idempotent subscription create clears sync_pending on existing sub_", () => {
  const checkout = readSource("src/lib/billing/providers/mollie/checkout.ts");
  assert.match(checkout, /provider_subscription_id\?\.startsWith\("sub_"\)/);
  assert.match(checkout, /Idempotent re-entry/);
  assert.match(checkout, /sync_pending:\s*false/);
  assert.match(checkout, /customerSubscriptions\.create/);
});

test("Terminal payment failure clears sync_pending and is not active", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /payment_failed/);
  assert.match(webhooks, /status:\s*"inactive"/);
  assert.match(webhooks, /isMolliePaymentTerminalFailure/);
});

test("Pending payment keeps sync_pending and incomplete status", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /payment_pending/);
  assert.match(webhooks, /status:\s*"incomplete"/);
});

test("Subscription create after mandate clears sync_pending", () => {
  const checkout = readSource("src/lib/billing/providers/mollie/checkout.ts");
  assert.match(checkout, /customerSubscriptions\.create/);
  assert.match(checkout, /sync_pending:\s*false/);
  assert.match(checkout, /last_reconciled_at/);
});

test("Refresh test state uses same authoritative reconcile path as webhook", () => {
  const actions = readSource("src/lib/billing/providers/mollie/test-checkout-actions.ts");
  assert.match(actions, /refreshMollieTestStateAction/);
  assert.match(actions, /reconcileMolliePaymentWebhook/);
  assert.match(actions, /first_payment_id/);
});

test("No duplicate subscription create when provider_subscription_id already present", () => {
  const checkout = readSource("src/lib/billing/providers/mollie/checkout.ts");
  // Early return before create when sub_ already mapped.
  const earlyGuardIdx = checkout.indexOf('provider_subscription_id?.startsWith("sub_")');
  const createIdx = checkout.indexOf("customerSubscriptions.create");
  assert.ok(earlyGuardIdx > 0 && createIdx > earlyGuardIdx);
});

test("FastSpring runtime preserved — Mollie does not call FastSpring modules", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.doesNotMatch(webhooks, /resolveOrganizationEntitlements/);
  assert.doesNotMatch(webhooks, /from ["']@\/lib\/fastspring/);
  assert.ok(pathExists("src/lib/fastspring/sync.ts"));
});

test("Parallel test state in mollie_test_subscriptions remains TEST-isolated", () => {
  const sync = readSource("src/lib/billing/providers/mollie/sync.ts");
  assert.match(sync, /mollie_test_subscriptions/);
  const customer = readSource("src/lib/billing/providers/mollie/customer.ts");
  assert.doesNotMatch(customer, /organization_subscriptions/);
  assert.match(customer, /mollie_test_subscriptions/);
  const checkout = readSource("src/lib/billing/providers/mollie/checkout.ts");
  assert.match(checkout, /MOLLIE_METADATA_BILLING_SURFACE.*test/);
});

test("Migration adds mollie to billing_provider CHECK", () => {
  const migration = readSource("supabase/migrations/20250820000000_mollie_test_subscription_lifecycle.sql");
  assert.match(migration, /'stripe', 'paddle', 'fastspring', 'mollie'/);
  const dbTypes = readSource("src/types/database.ts");
  assert.match(dbTypes, /billing_provider: "stripe" \| "paddle" \| "fastspring" \| "mollie"/);
});

test("RLS enabled on new Mollie tables with owner/admin select", () => {
  const migration = readSource("supabase/migrations/20250820000000_mollie_test_subscription_lifecycle.sql");
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /mollie_webhook_events_select_owner_admin/);
  assert.match(migration, /mollie_test_subscriptions_select_owner_admin/);
  assert.match(migration, /GRANT ALL ON TABLE public\.mollie_webhook_events TO service_role/);
});

test("Operator test harness — owner/admin auth, TEST credential gate", () => {
  assert.ok(pathExists("src/app/(dashboard)/settings/billing/mollie-test/page.tsx"));
  assert.ok(pathExists("src/components/settings/mollie-test-checkout-panel.tsx"));
  const page = readSource("src/app/(dashboard)/settings/billing/mollie-test/page.tsx");
  assert.match(page, /canManageOrganizationSettings/);
  assert.match(page, /isMollieTestCheckoutConfigured/);
  const actions = readSource("src/lib/billing/providers/mollie/test-checkout-actions.ts");
  assert.match(actions, /canManageOrganizationSettings/);
  assert.match(actions, /isMollieTestCheckoutConfigured/);
});

test("Safe return page — neutral verifying, no trust of query params for paid state", () => {
  const page = readSource("src/app/(dashboard)/settings/billing/mollie-test/return/page.tsx");
  assert.match(page, /Verifying Mollie payment/);
  assert.match(page, /not trusted|not trust/i);
  assert.match(page, /webhook/i);
  assert.doesNotMatch(page, /grant.*entitlement/i);
});

test("Internal diagnostics — sanitized state, no secrets", () => {
  const checkout = readSource("src/lib/billing/providers/mollie/checkout.ts");
  assert.match(checkout, /getMollieTestDiagnostics/);
  assert.match(checkout, /customerIdPrefix/);
  const panel = readSource("src/components/settings/mollie-test-checkout-panel.tsx");
  assert.match(panel, /sanitized/i);
  assert.doesNotMatch(panel, /MOLLIE_API_KEY=test_/);
  assert.doesNotMatch(panel, /console\.(log|info|debug)/);
});

test("FastSpring and Stripe runtime preserved", () => {
  assert.ok(pathExists("src/app/api/fastspring/webhook/route.ts"));
  assert.ok(pathExists("src/lib/fastspring/sync.ts"));
  assert.ok(pathExists("src/lib/billing/active-billing.ts"));
});

test("Billing actions.ts routes Mollie only via org provider resolution", () => {
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /getOrganizationBillingProvider/);
  assert.match(actions, /mollieCheckout/);
  assert.match(actions, /createMollieProductionFirstPayment/);
  // Global active provider is Mollie (sole provider).
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /return "mollie"/);
  assert.doesNotMatch(provider, /return "fastspring"/);
});

test("Canonical plan prices unchanged", () => {
  const plans = readSource("src/lib/billing/plans.ts");
  assert.match(plans, /amountMinorFallback:\s*17_900|amountMinor:\s*17_900/);
  assert.match(plans, /amountMinorFallback:\s*59_900|amountMinor:\s*59_900/);
  const catalog = readSource("src/lib/billing/price-catalog.ts");
  assert.match(catalog, /PRIMARY_BILLING_CURRENCY.*=.*"EUR"/);
});

test("Runtime Phase 2 modules remain present (Phase 3 adds alongside)", () => {
  const runtimeFiles = [
    "src/lib/billing/providers/mollie/env.ts",
    "src/lib/billing/providers/mollie/mode.ts",
    "src/lib/billing/providers/mollie/client.ts",
    "src/lib/billing/providers/mollie/connectivity.ts",
    "src/lib/billing/providers/mollie/foundation.ts",
    "src/lib/billing/providers/mollie/index.ts",
    "src/lib/billing/providers/mollie/customer.ts",
    "src/lib/billing/providers/mollie/checkout.ts",
    "src/lib/billing/providers/mollie/webhooks.ts",
    "src/lib/billing/providers/mollie/sync.ts",
    "src/lib/billing/providers/mollie/test-checkout-actions.ts",
    "src/app/api/mollie/connectivity/route.ts",
    "src/app/api/mollie/webhook/route.ts",
  ];
  for (const file of runtimeFiles) {
    assert.ok(pathExists(file), `Missing ${file}`);
  }
});

test("Mollie provider modules remain server-only", () => {
  for (const file of [
    "src/lib/billing/providers/mollie/customer.ts",
    "src/lib/billing/providers/mollie/checkout.ts",
    "src/lib/billing/providers/mollie/webhooks.ts",
    "src/lib/billing/providers/mollie/sync.ts",
  ]) {
    assert.match(readSource(file), /import "server-only"/, `${file} must be server-only`);
  }
});

test("No secrets logged from Mollie modules", () => {
  for (const file of [
    "src/lib/billing/providers/mollie/customer.ts",
    "src/lib/billing/providers/mollie/checkout.ts",
    "src/lib/billing/providers/mollie/webhooks.ts",
  ]) {
    const src = readSource(file);
    assert.doesNotMatch(src, /console\.(log|info|debug).*MOLLIE_API_KEY/);
    assert.doesNotMatch(src, /console\.(log|info|debug).*apiKey/);
  }
});

test("extractMollieWebhookPaymentId supports form body and JSON", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /URLSearchParams/);
  assert.match(webhooks, /JSON\.parse/);
  assert.match(webhooks, /startsWith\("tr_"\)/);
});

test("Foundation phase updated to phase_3_production_integration", () => {
  const foundation = readSource("src/lib/billing/providers/mollie/foundation.ts");
  assert.match(foundation, /phase_3_production_integration/);
  assert.match(foundation, /mollie_test_subscriptions/);
});

test("package.json test:mollie-billing includes lifecycle suite", () => {
  const pkg = JSON.parse(readSource("package.json"));
  assert.match(pkg.scripts["test:mollie-billing"], /mollie-billing-lifecycle\.test\.mjs/);
});
