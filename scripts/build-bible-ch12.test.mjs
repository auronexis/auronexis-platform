import assert from "node:assert/strict";
import test from "node:test";
import {
  assertDocAndRule,
  pathExists,
  readSource,
} from "./_test-helpers/read-source.mjs";

test("Build Bible V2 Chapter 12 billing doc and rule exist", () => {
  const { doc, rule } = assertDocAndRule({
    docRelativePath: "docs/14_BUILD_BIBLE_V2_CHAPTER_12_PADDLE_BILLING.md",
    ruleRelativePath: ".cursor/rules/build-bible-v2-ch12-paddle-billing.mdc",
  });
  assert.match(doc, /entitlements\/resolver\.ts/);
  assert.match(doc, /Never grant entitlements from browser checkout success alone/);
  assert.match(rule, /getActiveBillingProvider/);
  assert.match(rule, /resolveOrganizationEntitlements/);
});

test("Mollie is the sole active checkout provider; FastSpring webhook is retired", () => {
  const provider = readSource("src/lib/billing/provider.ts");
  const selection = readSource("src/lib/billing/subscription-selection.ts");
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(provider, /return "mollie"/);
  assert.doesNotMatch(provider, /return "fastspring"/);
  assert.doesNotMatch(provider, /return "stripe"/);
  assert.doesNotMatch(provider, /return "paddle"/);
  assert.match(provider, /Mollie is the sole active billing provider/i);
  assert.match(selection, /legacy Paddle|FastSpring|Mollie/i);
  assert.match(actions, /createMollieProductionFirstPayment|mollieCheckout/);
  assert.doesNotMatch(actions, /createFastSpringCheckoutPayloadForPlan/);
  assert.ok(!pathExists("src/lib/stripe"));
  assert.ok(!pathExists("src/lib/paddle"));
  assert.ok(!pathExists("src/app/api/paddle/webhook/route.ts"));
  assert.ok(pathExists("src/app/api/mollie/webhook/route.ts"));
  assert.ok(pathExists("src/app/api/fastspring/webhook/route.ts"));
});

test("fastspring webhook route is retired to 410; Mollie webhook is active", () => {
  const route = readSource("src/app/api/fastspring/webhook/route.ts");
  assert.match(route, /status:\s*410/);
  assert.doesNotMatch(route, /verifyFastSpringSignature|handleFastSpringWebhookEvent/);
  assert.ok(pathExists("src/app/api/mollie/webhook/route.ts"));
  const mollieRoute = readSource("src/app/api/mollie/webhook/route.ts");
  assert.match(mollieRoute, /mollie|payment/i);
});

test("idempotency recovers stale processing and checks payload hash", () => {
  const idempotency = readSource("src/lib/fastspring/idempotency.ts");
  assert.match(idempotency, /PROCESSING_STALE_MS/);
  assert.match(idempotency, /payload hash mismatch/);
  assert.match(idempotency, /retrying stale processing webhook/);
});

test("entitlements document a single authoritative resolver", () => {
  const resolver = readSource("src/lib/entitlements/resolver.ts");
  assert.match(resolver, /Authoritative entitlement resolution/);
  assert.match(resolver, /export async function resolveOrganizationEntitlements/);
});

test("customer portal emits billing_portal_opened commercial event", () => {
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /billing_portal_opened/);
  assert.match(actions, /trackBillingLifecycleEvent/);
});

test("commercial event catalog and ops doc describe sole active billing provider", () => {
  const commercial = readSource("src/lib/billing/commercial-events.ts");
  const billing = readSource("docs/billing.md");
  const historical = readSource("docs/paddle-billing.md");
  assert.match(commercial, /COMMERCIAL_EVENT_NAMES/);
  assert.doesNotMatch(commercial, /PADDLE_WEBHOOK_EVENT_TYPES/);
  assert.match(billing, /Mollie-only|sole.*Mollie|Mollie sole/i);
  assert.doesNotMatch(billing, /Set `BILLING_PROVIDER=stripe`/);
  assert.match(historical, /STATUS:\s*HISTORICAL\s*\/\s*SUPERSEDED/i);
  assert.match(historical, /CURRENT BILLING PROVIDER:\s*MOLLIE/i);
  assert.match(historical, /DO NOT USE THIS DOCUMENT FOR CURRENT PRODUCTION OPERATIONS/i);
});

test("cleanup recommendations no longer instruct Stripe re-sync as active path", () => {
  const cleanup = readSource("src/lib/billing/cleanup-recommendations.ts");
  assert.match(cleanup, /Paddle/);
  assert.doesNotMatch(cleanup, /Re-sync invoices from Stripe/);
});
