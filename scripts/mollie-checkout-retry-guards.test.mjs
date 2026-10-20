/**
 * Mollie checkout retry / duplicate-purchase guards + callback URL + webhook mode mismatch.
 * Run: node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/mollie-checkout-retry-guards.test.mjs
 */
import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const guards = await import("../src/lib/billing/providers/mollie/checkout-guards.ts");
const modeMismatch = await import("../src/lib/billing/providers/mollie/mode-mismatch.ts");
const callbacks = await import("../src/lib/billing/providers/mollie/callback-urls.ts");

const { assertNoFastSpringConflict, assertNoDuplicateMollieSubscription } = guards;
const { isMollieModeMismatchError } = modeMismatch;
const { resolveMollieCallbackBaseUrl, buildMollieWebhookUrl } = callbacks;

function baseRow(overrides = {}) {
  return {
    id: "sub-row-1",
    organization_id: "org-1",
    billing_provider: "mollie",
    provider_customer_id: "cst_test",
    provider_subscription_id: null,
    provider_price_id: "professional",
    provider_status: "expired",
    sync_pending: false,
    status: "incomplete_expired",
    cancel_at_period_end: false,
    current_period_start: null,
    current_period_end: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    stripe_price_id: null,
    trial_ends_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    legacy_archived: false,
    ...overrides,
  };
}

const envKeys = [
  "NEXT_PUBLIC_APP_URL",
  "VERCEL_ENV",
  "VERCEL_URL",
  "NODE_ENV",
  "MOLLIE_API_KEY",
];

const savedEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of envKeys) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key];
    }
  }
});

describe("assertNoFastSpringConflict — checkout retry allowlist", () => {
  it("(a) org whose first payment expired can start checkout again", () => {
    const expiredMollie = baseRow({
      billing_provider: "mollie",
      provider_subscription_id: null,
      provider_status: "expired",
      status: "incomplete_expired",
    });
    assert.doesNotThrow(() => assertNoFastSpringConflict(expiredMollie));
    assert.doesNotThrow(() => assertNoDuplicateMollieSubscription(expiredMollie));
  });

  it("(b) org with no subscription row can start checkout", () => {
    assert.doesNotThrow(() => assertNoFastSpringConflict(null));
    assert.doesNotThrow(() => assertNoDuplicateMollieSubscription(null));
  });

  it("(c) org with verified active Mollie subscription still blocked", () => {
    const active = baseRow({
      billing_provider: "mollie",
      provider_subscription_id: "sub_active",
      provider_status: "active",
      status: "active",
    });
    assert.doesNotThrow(() => assertNoFastSpringConflict(active));
    assert.throws(
      () => assertNoDuplicateMollieSubscription(active),
      /duplicate_mollie/,
    );
  });

  it("(d) legacy-quarantined row still proceeds", () => {
    const quarantined = baseRow({
      billing_provider: "fastspring",
      provider_subscription_id: "fs_legacy",
      provider_status: "active",
      status: "active",
      legacy_archived: true,
    });
    assert.doesNotThrow(() => assertNoFastSpringConflict(quarantined));
    assert.doesNotThrow(() => assertNoDuplicateMollieSubscription(quarantined));
  });

  it("allows null / empty / none provider rows", () => {
    for (const provider of [null, "", "none", "  none  "]) {
      assert.doesNotThrow(() => assertNoFastSpringConflict(baseRow({ billing_provider: provider })));
    }
  });

  it("throws provider_conflict only for unknown non-Mollie providers", () => {
    assert.throws(
      () => assertNoFastSpringConflict(baseRow({ billing_provider: "adyen" })),
      /provider_conflict/,
    );
  });
});

describe("isMollieModeMismatchError", () => {
  it("detects wrong-mode / test-vs-live messages", () => {
    assert.equal(isMollieModeMismatchError(new Error("The payment is in the wrong mode")), true);
    assert.equal(
      isMollieModeMismatchError(new Error("Cannot retrieve a test payment with a live API key")),
      true,
    );
    assert.equal(isMollieModeMismatchError(new Error("mode mismatch between key and payment")), true);
    assert.equal(isMollieModeMismatchError(new Error("Payment not found")), false);
  });
});

describe("resolveMollieCallbackBaseUrl — environment-specific", () => {
  it("preview uses VERCEL_URL even when NEXT_PUBLIC_APP_URL is production", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "auroranexis-git-preview.vercel.app";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.auroranexis.com";
    process.env.MOLLIE_API_KEY = "test_dummy";
    assert.equal(resolveMollieCallbackBaseUrl(), "https://auroranexis-git-preview.vercel.app");
    assert.match(buildMollieWebhookUrl(), /^https:\/\/auroranexis-git-preview\.vercel\.app\/api\/mollie\/webhook$/);
  });

  it("local development never uses production app host", () => {
    process.env.VERCEL_ENV = "development";
    delete process.env.VERCEL_URL;
    process.env.NODE_ENV = "development";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.auroranexis.com";
    process.env.MOLLIE_API_KEY = "test_dummy";
    assert.equal(resolveMollieCallbackBaseUrl(), "http://localhost:3000");
  });

  it("production LIVE uses NEXT_PUBLIC_APP_URL", () => {
    process.env.VERCEL_ENV = "production";
    delete process.env.VERCEL_URL;
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.auroranexis.com";
    process.env.MOLLIE_API_KEY = "live_dummy";
    assert.equal(resolveMollieCallbackBaseUrl(), "https://app.auroranexis.com");
  });

  it("TEST credentials never resolve to production app host", () => {
    process.env.VERCEL_ENV = "production";
    delete process.env.VERCEL_URL;
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.auroranexis.com";
    process.env.MOLLIE_API_KEY = "test_dummy";
    assert.equal(resolveMollieCallbackBaseUrl(), "http://localhost:3000");
  });
});

describe("source contracts — webhook mode mismatch + checkout Sentry", () => {
  it("webhook acknowledges mode mismatch with HTTP 200 and Sentry warning tag", () => {
    const route = readSource("src/app/api/mollie/webhook/route.ts");
    assert.match(route, /isMollieModeMismatchError/);
    assert.match(route, /mollie_mode_mismatch/);
    assert.match(route, /captureWarning/);
    assert.match(route, /status:\s*200/);
    assert.match(route, /captureException/);
    assert.match(route, /paymentIdPrefix/);
  });

  it("checkout action captures exceptions with area=billing step=checkout", () => {
    const actions = readSource("src/lib/billing/actions.ts");
    assert.match(actions, /captureException/);
    assert.match(actions, /area:\s*"billing"/);
    assert.match(actions, /step:\s*"checkout"/);
    assert.match(actions, /organizationId:\s*session\.organization\.id/);
  });
});
