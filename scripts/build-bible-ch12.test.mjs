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

test("paddle remains the sole active billing provider", () => {
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /return "paddle"/);
  assert.doesNotMatch(provider, /return "stripe"/);
  assert.ok(!pathExists("src/lib/stripe"));
});

test("webhook route verifies signature and emits commercial events", () => {
  const route = readSource("src/app/api/paddle/webhook/route.ts");
  const webhooks = readSource("src/lib/paddle/webhooks.ts");
  assert.match(route, /unmarshal/);
  assert.match(route, /ensurePaddleIdempotency/);
  assert.match(route, /emitPaddleWebhookCommercialEvent/);
  assert.match(route, /invalidateCachesAfterWebhook/);
  assert.match(webhooks, /trackBillingLifecycleEvent/);
  assert.match(webhooks, /PADDLE_WEBHOOK_EVENT_TYPES/);
});

test("idempotency recovers stale processing and checks payload hash", () => {
  const idempotency = readSource("src/lib/paddle/idempotency.ts");
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

test("commercial event catalog and ops doc are paddle-sole", () => {
  const commercial = readSource("src/lib/billing/commercial-events.ts");
  const docs = readSource("docs/paddle-billing.md");
  assert.match(commercial, /PADDLE_WEBHOOK_EVENT_TYPES/);
  assert.match(commercial, /COMMERCIAL_EVENT_NAMES/);
  assert.match(docs, /sole active billing provider/i);
  assert.doesNotMatch(docs, /Set `BILLING_PROVIDER=stripe`/);
});

test("cleanup recommendations no longer instruct Stripe re-sync as active path", () => {
  const cleanup = readSource("src/lib/billing/cleanup-recommendations.ts");
  assert.match(cleanup, /Paddle/);
  assert.doesNotMatch(cleanup, /Re-sync invoices from Stripe/);
});
