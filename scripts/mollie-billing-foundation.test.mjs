/**
 * Mollie Phase 1 foundation regression suite.
 * Source-contract style — does not import server-only modules at runtime.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource, pathExists } from "./_test-helpers/read-source.mjs";

test("BillingProvider union includes mollie alongside legacy providers", () => {
  const types = readSource("src/lib/billing/provider-types.ts");
  assert.match(types, /export type BillingProvider = .*\bmollie\b/);
  assert.match(types, /global default active checkout provider/i);
  assert.match(types, /per-org allowlist/i);
});

test("getActiveBillingProvider returns mollie — sole active provider", () => {
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /return "mollie"/);
  assert.doesNotMatch(provider, /return "fastspring"/);
});

test("MOLLIE_API_KEY placeholder in .env.example — no real secret", () => {
  const envExample = readSource(".env.example");
  assert.match(envExample, /MOLLIE_API_KEY/);
  assert.match(envExample, /MOLLIE_BILLING_ROLLOUT|per-org rollout/i);
  assert.doesNotMatch(envExample, /MOLLIE_API_KEY=test_[A-Za-z0-9]{10,}/);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_MOLLIE/);
});

test("@mollie/api-client pinned in package.json", () => {
  const pkg = JSON.parse(readSource("package.json"));
  assert.equal(pkg.dependencies["@mollie/api-client"], "4.6.0");
});

test("Mollie provider modules are server-only", () => {
  for (const file of [
    "src/lib/billing/providers/mollie/env.ts",
    "src/lib/billing/providers/mollie/client.ts",
    "src/lib/billing/providers/mollie/connectivity.ts",
  ]) {
    assert.match(readSource(file), /import "server-only"/, `${file} must be server-only`);
  }
});

test("resolveMollieApiModeFromKey: test_ → test, live_ → live, unknown → null", () => {
  const mode = readSource("src/lib/billing/providers/mollie/mode.ts");
  assert.match(mode, /trimmed\.startsWith\("test_"\)/);
  assert.match(mode, /trimmed\.startsWith\("live_"\)/);
  assert.match(mode, /return null/);
  assert.match(mode, /fail closed for payment ops/i);
});

test("connectivity probe uses read-only methods.list — no charge creation", () => {
  const connectivity = readSource("src/lib/billing/providers/mollie/connectivity.ts");
  assert.match(connectivity, /methods\.list\(\)/);
  assert.doesNotMatch(connectivity, /\.payments\.create/);
  assert.doesNotMatch(connectivity, /\.customers\.create/);
  assert.doesNotMatch(connectivity, /\.subscriptions\.create/);
});

test("connectivity source never logs full API key", () => {
  const sources = [
    "src/lib/billing/providers/mollie/env.ts",
    "src/lib/billing/providers/mollie/connectivity.ts",
    "src/lib/billing/providers/mollie/client.ts",
  ];
  for (const file of sources) {
    const src = readSource(file);
    assert.doesNotMatch(src, /console\.(log|info|debug).*MOLLIE_API_KEY/);
    assert.doesNotMatch(src, /console\.(log|info|debug).*apiKey/);
  }
});

test("Mollie connectivity API route exists and is authorized", () => {
  const route = readSource("src/app/api/mollie/connectivity/route.ts");
  assert.match(route, /probeMollieApiConnectivity/);
  assert.match(route, /verifyCronAuthorization/);
  assert.match(route, /canManageOrganizationSettings/);
  assert.match(route, /foundation-only|does not activate billing/i);
});

test("Mollie webhook route exists in Phase 2", () => {
  assert.equal(pathExists("src/app/api/mollie/webhook/route.ts"), true);
});

test("Mollie checkout implementation exists (TEST harness + production)", () => {
  assert.equal(pathExists("src/lib/billing/providers/mollie/checkout.ts"), true);
  assert.equal(pathExists("src/lib/billing/providers/mollie/test-checkout-actions.ts"), true);
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /return "mollie"/);
});

test("Foundation metadata correlation keys defined", () => {
  const foundation = readSource("src/lib/billing/providers/mollie/foundation.ts");
  assert.match(foundation, /MOLLIE_METADATA_ORGANIZATION_ID/);
  assert.match(foundation, /MOLLIE_METADATA_PLAN_KEY/);
  assert.match(foundation, /MOLLIE_METADATA_CHECKOUT_ATTEMPT_ID/);
});

test("Idempotency strategy documented for Phase 2+", () => {
  const foundation = readSource("src/lib/billing/providers/mollie/foundation.ts");
  assert.match(foundation, /idempotency/i);
  assert.match(foundation, /mollie_webhook_events|webhook.*ledger/i);
  assert.match(foundation, /fetch authoritative object/i);
});

test("Generic provider columns mapping documented — org↔Customer, sub↔Subscription", () => {
  const foundation = readSource("src/lib/billing/providers/mollie/foundation.ts");
  assert.match(foundation, /provider_customer_id/);
  assert.match(foundation, /provider_subscription_id/);
  assert.match(foundation, /Customer\.id/);
  assert.match(foundation, /Subscription\.id/);
});

test("Enterprise flow untouched — manual billing contact path preserved", () => {
  const enterprise = readSource("src/lib/billing/enterprise-contact.ts");
  assert.match(enterprise, /ENTERPRISE_BILLING_CONTACT_PATH/);
  const foundation = readSource("src/lib/billing/providers/mollie/foundation.ts");
  assert.match(foundation, /Enterprise plans remain manual/);
});

test("Canonical plan prices unchanged — SUBSCRIPTION_PLANS source of truth", () => {
  const plans = readSource("src/lib/billing/plans.ts");
  assert.match(plans, /amountMinorFallback:\s*17_900|amountMinor:\s*17_900/);
  assert.match(plans, /amountMinorFallback:\s*59_900|amountMinor:\s*59_900/);
  assert.match(plans, /amountMinorFallback:\s*179_900|amountMinor:\s*179_900/);
  assert.match(plans, /PRIMARY_BILLING_CURRENCY/);
  const catalog = readSource("src/lib/billing/price-catalog.ts");
  assert.match(catalog, /currency:\s*"EUR"/);
});

test("Database billing_provider CHECK includes mollie in Phase 2 migration", () => {
  const migration = readSource("supabase/migrations/20250820000000_mollie_test_subscription_lifecycle.sql");
  assert.match(migration, /'mollie'/);
  const dbTypes = readSource("src/types/database.ts");
  assert.match(dbTypes, /billing_provider: "stripe" \| "paddle" \| "fastspring" \| "mollie"/);
});

test("platform-health exposes Mollie foundation diagnostics", () => {
  const health = readSource("src/lib/diagnostics/platform-health.ts");
  assert.match(health, /checkMollieApiConfigHealth/);
  assert.match(health, /checkMollieApiConnectivityHealth/);
  assert.match(health, /foundation/i);
});

test("FastSpring webhook route remains as 410 retirement stub", () => {
  assert.ok(pathExists("src/app/api/fastspring/webhook/route.ts"));
  const webhook = readSource("src/app/api/fastspring/webhook/route.ts");
  assert.match(webhook, /status:\s*410/);
  assert.ok(pathExists("src/lib/billing/active-billing.ts"));
});

test("Mollie sole-provider test contract exists", () => {
  const sole = readSource("scripts/mollie-sole-provider.test.mjs");
  assert.match(sole, /getActiveBillingProvider returns mollie/);
});

test("package.json includes test:mollie-billing script", () => {
  const pkg = JSON.parse(readSource("package.json"));
  assert.match(pkg.scripts["test:mollie-billing"], /mollie-billing-foundation\.test\.mjs/);
});

test("Mollie client factory fails closed on invalid key prefix", () => {
  const client = readSource("src/lib/billing/providers/mollie/client.ts");
  assert.match(client, /assertMollieApiModeForPaymentOps/);
  const mode = readSource("src/lib/billing/providers/mollie/mode.ts");
  assert.match(mode, /Invalid MOLLIE_API_KEY prefix/);
});

test("Runtime Phase 1 core modules remain present", () => {
  const runtimeFiles = [
    "src/lib/billing/providers/mollie/env.ts",
    "src/lib/billing/providers/mollie/mode.ts",
    "src/lib/billing/providers/mollie/client.ts",
    "src/lib/billing/providers/mollie/connectivity.ts",
    "src/lib/billing/providers/mollie/foundation.ts",
    "src/lib/billing/providers/mollie/index.ts",
    "src/lib/billing/provider-types.ts",
    "src/lib/diagnostics/platform-health.ts",
    "src/app/api/mollie/connectivity/route.ts",
  ];
  for (const file of runtimeFiles) {
    assert.ok(pathExists(file), `Missing ${file}`);
  }
});
