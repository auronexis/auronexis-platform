import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { pathExists, readSource } from "./_test-helpers/read-source.mjs";

/**
 * FastSpring webhook foundation — source-contract + pure crypto/status/product tests.
 * Mirrors logic in src/lib/fastspring/* without importing server-only modules.
 */

function computeSignature(rawBody, secret) {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
}

function mapProduct(path) {
  switch ((path ?? "").trim().toLowerCase()) {
    case "professional":
      return "professional";
    case "business":
      return "business";
    case "enterprise":
      return "enterprise";
    case "pilot-client":
      return "pilot";
    case "founding-member":
      return "founding";
    default:
      return null;
  }
}

function mapState(state) {
  switch ((state ?? "").trim().toLowerCase()) {
    case "active":
      return "active";
    case "trial":
      return "trialing";
    case "overdue":
      return "past_due";
    case "canceled":
    case "cancelled":
      return "canceled";
    case "deactivated":
      return "inactive";
    case "paused":
      return "paused";
    default:
      return null;
  }
}

function resolveStatus(eventType, state, active) {
  const fromState = mapState(state);
  if (fromState) return fromState;
  switch (eventType) {
    case "subscription.activated":
    case "subscription.uncanceled":
    case "subscription.resumed":
    case "subscription.charge.completed":
      return active === false ? "inactive" : "active";
    case "subscription.deactivated":
      return "inactive";
    case "subscription.canceled":
      return "canceled";
    case "subscription.payment.overdue":
      return "past_due";
    case "subscription.paused":
      return "paused";
    case "subscription.charge.failed":
      return "payment_failed";
    case "subscription.updated":
      return null;
    default:
      return null;
  }
}

test("fastspring webhook route verifies raw body HMAC before processing", () => {
  const route = readSource("src/app/api/fastspring/webhook/route.ts");
  assert.match(route, /request\.text\(\)/);
  assert.match(route, /x-fs-signature|getFastSpringSignatureHeader/i);
  assert.match(route, /verifyFastSpringSignature/);
  assert.match(route, /ensureFastSpringIdempotency/);
  assert.match(route, /status: 400/);
  assert.match(route, /FASTSPRING_WEBHOOK_SECRET|isFastSpringWebhookConfigured/);
});

test("fastspring signature helper uses official X-FS-Signature HMAC-SHA256 base64", () => {
  const signature = readSource("src/lib/fastspring/signature.ts");
  assert.match(signature, /x-fs-signature/);
  assert.match(signature, /createHmac\("sha256"/);
  assert.match(signature, /digest\("base64"\)/);
  assert.match(signature, /timingSafeEqual/);
  assert.match(signature, /developer\.fastspring\.com\/reference\/message-security/);
});

test("valid HMAC SHA256 matches FastSpring documented algorithm", () => {
  const secret = "test-fastspring-secret";
  const body = JSON.stringify({
    events: [{ id: "evt_1", type: "subscription.activated", data: {} }],
  });
  const expected = computeSignature(body, secret);
  assert.equal(computeSignature(body, secret), expected);
  assert.notEqual(computeSignature(body + "x", secret), expected);
  assert.notEqual(computeSignature(body, "other"), expected);
});

test("invalid / missing signature cases are rejected by route contract", () => {
  const route = readSource("src/app/api/fastspring/webhook/route.ts");
  assert.match(route, /Missing X-FS-Signature header/);
  assert.match(route, /Invalid FastSpring signature/);
  assert.match(route, /Malformed FastSpring payload/);
});

test("handled FastSpring event names are exact and include required set", () => {
  const events = readSource("src/lib/fastspring/events.ts");
  for (const name of [
    "order.completed",
    "order.canceled",
    "order.failed",
    "order.payment.pending",
    "subscription.activated",
    "subscription.deactivated",
    "subscription.canceled",
    "subscription.uncanceled",
    "subscription.updated",
    "subscription.payment.overdue",
    "subscription.paused",
    "subscription.resumed",
    "subscription.charge.completed",
    "subscription.charge.failed",
  ]) {
    assert.match(events, new RegExp(`"${name.replace(/\./g, "\\.")}"`));
  }
  assert.doesNotMatch(events, /customer\.subscription\.updated/);
  assert.doesNotMatch(events, /invoice\.payment_succeeded/);
});

test("unknown events are ignored safely in handler", () => {
  const webhooks = readSource("src/lib/fastspring/webhooks.ts");
  assert.match(webhooks, /unknown_event/);
  assert.match(webhooks, /isFastSpringHandledEventType/);
  assert.match(webhooks, /unmapped_organization/);
});

test("product path mapping preserves founding-member and pilot-client", () => {
  assert.equal(mapProduct("professional"), "professional");
  assert.equal(mapProduct("business"), "business");
  assert.equal(mapProduct("enterprise"), "enterprise");
  assert.equal(mapProduct("pilot-client"), "pilot");
  assert.equal(mapProduct("founding-member"), "founding");
  assert.equal(mapProduct("starter"), null);
  assert.equal(mapProduct("unknown"), null);

  const catalog = readSource("src/lib/billing/catalog.ts");
  const products = readSource("src/lib/fastspring/products.ts");
  assert.match(catalog, /founding-member/);
  assert.match(catalog, /pilot-client/);
  assert.doesNotMatch(catalog, /"starter"/);
  assert.match(products, /FASTSPRING_PRODUCT_PATHS/);
  assert.match(products, /@\/lib\/billing\/catalog/);
});

test("subscription status mapping covers activated updated canceled charge events", () => {
  assert.equal(resolveStatus("subscription.activated", "active", true), "active");
  assert.equal(resolveStatus("subscription.activated", "trial", true), "trialing");
  assert.equal(resolveStatus("subscription.updated", "overdue", true), "past_due");
  assert.equal(resolveStatus("subscription.updated", null, true), null);
  assert.equal(resolveStatus("subscription.canceled", "canceled", false), "canceled");
  assert.equal(resolveStatus("subscription.charge.completed", null, true), "active");
  assert.equal(resolveStatus("subscription.charge.failed", null, true), "payment_failed");
  assert.equal(resolveStatus("subscription.paused", null, true), "paused");
  assert.equal(resolveStatus("subscription.deactivated", null, false), "inactive");
});

test("idempotency migration uses provider + event id uniqueness", () => {
  const migration = readSource(
    "supabase/migrations/20250726120000_fastspring_webhook_foundation.sql",
  );
  assert.match(migration, /fastspring_webhook_events/);
  assert.match(migration, /UNIQUE \(provider, provider_event_id\)/);
  assert.match(migration, /billing_provider IN \('stripe', 'paddle', 'fastspring'\)/);
  assert.doesNotMatch(migration, /DROP COLUMN/);
  assert.doesNotMatch(migration, /DROP TABLE.*organization_subscriptions/);
});

test("org matching never uses email alone", () => {
  const matching = readSource("src/lib/fastspring/org-matching.ts");
  assert.match(matching, /Never match by customer email/);
  assert.doesNotMatch(matching, /contact\.email|buyer\.email/);
  assert.match(matching, /organization_id/);
  assert.match(matching, /lookup\.custom|customLookupId/);
});

test("usable paddle rows are never overwritten by fastspring sync", () => {
  const sync = readSource("src/lib/fastspring/sync.ts");
  assert.match(sync, /usable_paddle_subscription_present/);
  assert.match(sync, /refusing to overwrite usable Paddle/);
  assert.match(sync, /billing_provider: "fastspring"/);
});

test("fastspring secrets stay server-only", () => {
  const env = readSource("src/lib/fastspring/env.ts");
  const envExample = readSource(".env.example");
  assert.match(env, /server-only/);
  assert.match(env, /FASTSPRING_WEBHOOK_SECRET/);
  assert.match(env, /FASTSPRING_API_USERNAME/);
  assert.match(env, /FASTSPRING_API_PASSWORD/);
  assert.doesNotMatch(env, /NEXT_PUBLIC_FASTSPRING/);
  assert.match(envExample, /^FASTSPRING_WEBHOOK_SECRET=/m);
  assert.match(envExample, /^FASTSPRING_API_USERNAME=/m);
  assert.match(envExample, /^FASTSPRING_API_PASSWORD=/m);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_FASTSPRING/);
});

test("diagnostics report secret presence without value", () => {
  const health = readSource("src/lib/diagnostics/platform-health.ts");
  assert.match(health, /checkFastSpringWebhookHealth/);
  assert.match(health, /checkFastSpringApiConfigHealth/);
  assert.match(health, /FASTSPRING_WEBHOOK_SECRET configured: yes/);
  assert.match(health, /FASTSPRING_WEBHOOK_SECRET configured: no/);
  assert.match(health, /FASTSPRING_API credentials configured/);
  assert.doesNotMatch(health, /slice\(0,\s*[0-9]+\)/);
});

test("active billing provider is fastspring after cutover", () => {
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /return "fastspring"/);
  assert.doesNotMatch(provider, /return "paddle"/);
  assert.doesNotMatch(provider, /return "stripe"/);
  assert.match(provider, /Usable legacy Paddle subscription/);
  assert.match(provider, /isPaddleCheckoutEnabled/);
});

test("fastspring webhook route file exists at expected path", () => {
  assert.ok(pathExists("src/app/api/fastspring/webhook/route.ts"));
  assert.ok(pathExists("src/lib/fastspring/signature.ts"));
});

test("fastspring API connectivity probe uses Basic Auth and read-only accounts list", () => {
  const connectivity = readSource("src/lib/fastspring/connectivity.ts");
  const route = readSource("src/app/api/fastspring/connectivity/route.ts");
  assert.match(connectivity, /api\.fastspring\.com/);
  assert.match(connectivity, /\/accounts\?limit=1/);
  assert.match(connectivity, /Basic /);
  assert.match(connectivity, /User-Agent/);
  assert.match(connectivity, /developer\.fastspring\.com\/reference\/api-overview/);
  assert.match(connectivity, /errorCategory/);
  assert.doesNotMatch(connectivity, /console\.error\([^\n]*Authorization/i);
  assert.doesNotMatch(connectivity, /console\.(error|log|warn)\([^\n]*FASTSPRING_API_/);
  assert.match(route, /verifyCronAuthorization/);
  assert.match(route, /canManageOrganizationSettings|getSession/);
  assert.match(route, /probeFastSpringApiConnectivity/);
  assert.match(route, /Cache-Control.*no-store/);
  assert.doesNotMatch(route, /FASTSPRING_API_PASSWORD/);
  assert.doesNotMatch(route, /Authorization.*Basic/);
});
