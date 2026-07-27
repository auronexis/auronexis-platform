/**
 * Source-contract tests for the FastSpring production billing cutover.
 * Does not import server-only modules.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { pathExists, readSource } from "./_test-helpers/read-source.mjs";

const EXPECTED_PATHS = [
  "professional",
  "business",
  "enterprise",
  "founding-member",
  "pilot-client",
];

test("canonical catalog has exactly 5 FastSpring paths and no starter", () => {
  const catalog = readSource("src/lib/billing/catalog.ts");
  assert.match(catalog, /FASTSPRING_PRODUCT_PATHS/);
  assert.match(catalog, /CANONICAL_PLAN_CATALOG/);
  for (const path of EXPECTED_PATHS) {
    assert.match(catalog, new RegExp(`"${path}"`));
  }
  assert.doesNotMatch(catalog, /"starter"/);
  assert.match(catalog, /as const/);

  const pathsBlock = catalog.match(
    /export const FASTSPRING_PRODUCT_PATHS = \[([\s\S]*?)\] as const/,
  );
  assert.ok(pathsBlock, "FASTSPRING_PRODUCT_PATHS array missing");
  const quoted = [...pathsBlock[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(quoted, EXPECTED_PATHS);
});

test("catalog visibility separates public commercial plans from private programs", () => {
  const catalog = readSource("src/lib/billing/catalog.ts");
  assert.match(catalog, /visibility: "public"/);
  assert.match(catalog, /visibility: "private"/);
  assert.match(catalog, /listPublicCatalogEntries/);
  assert.match(catalog, /listPrivateCatalogEntries/);
  assert.match(catalog, /productPath: "founding-member"[\s\S]*?visibility: "private"/);
  assert.match(catalog, /productPath: "pilot-client"[\s\S]*?visibility: "private"/);
  assert.match(catalog, /productPath: "professional"[\s\S]*?visibility: "public"/);
  assert.match(catalog, /productPath: "business"[\s\S]*?visibility: "public"/);
  assert.match(catalog, /productPath: "enterprise"[\s\S]*?visibility: "public"/);
});

test("getActiveBillingProvider returns fastspring", () => {
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /return "fastspring"/);
  assert.doesNotMatch(provider, /return "paddle"/);
  assert.doesNotMatch(provider, /return "stripe"/);
  assert.match(provider, /Usable legacy Paddle subscription/);
  assert.match(provider, /isPaddleCheckoutEnabled/);
  assert.match(provider, /isFastSpringActiveBillingProvider/);
});

test("createCheckoutSessionAction uses FastSpring when active", () => {
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /getActiveBillingProvider/);
  assert.match(actions, /activeProvider === "fastspring"/);
  assert.match(actions, /createFastSpringCheckoutPayloadForPlan/);
  assert.match(actions, /fastspringCheckout/);
  assert.match(actions, /FASTSPRING_STOREFRONT/);
  assert.match(actions, /Legacy path — only if active provider is still paddle/);
  assert.match(actions, /createPaddleCheckoutPayload/);
});

test("usable paddle overwrite refused in FastSpring sync", () => {
  const sync = readSource("src/lib/fastspring/sync.ts");
  assert.match(sync, /usable_paddle_subscription_present/);
  assert.match(sync, /refusing to overwrite usable Paddle/);
  assert.match(sync, /isPaddleBackedSubscription|billing_provider === "paddle"/);
});

test("localized pricing falls back to USD without inventing FX", () => {
  const pricing = readSource("src/lib/fastspring/localized-pricing.ts");
  assert.match(pricing, /Never fabricates foreign FX/);
  assert.match(pricing, /falls back to base USD only/);
  assert.match(pricing, /base_usd_fallback/);
  assert.match(pricing, /buildUsdFallback/);
  assert.match(pricing, /currency: "USD"/);
  assert.doesNotMatch(pricing, /exchangeRate|fxRate|convertCurrency|invent/i);
});

test("FASTSPRING_STOREFRONT documented in .env.example", () => {
  const envExample = readSource(".env.example");
  assert.match(envExample, /^FASTSPRING_STOREFRONT=/m);
  assert.match(envExample, /data-storefront/i);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_FASTSPRING/);
});

test("CSP allows FastSpring Store Builder script and stylesheet origins", () => {
  const csp = readSource("src/lib/security/csp.ts");
  const vercel = readSource("vercel.json");
  assert.match(csp, /script-src[\s\S]*sbl\.onfastspring\.com/);
  assert.match(csp, /style-src[\s\S]*sbl\.onfastspring\.com/);
  assert.match(vercel, /style-src 'self' 'unsafe-inline' https:\/\/sbl\.onfastspring\.com/);
  assert.match(vercel, /sbl\.onfastspring\.com/);
});

test("organization_id checkout tags are required for FastSpring", () => {
  const tags = readSource("src/lib/fastspring/checkout-tags.ts");
  const checkout = readSource("src/lib/fastspring/checkout.ts");
  const browser = readSource("src/lib/fastspring/browser-checkout.ts");
  assert.match(tags, /organization_id: string/);
  assert.match(tags, /buildFastSpringCheckoutTags/);
  assert.match(tags, /Invalid organization_id for FastSpring checkout tags/);
  assert.match(checkout, /organization_id|buildFastSpringCheckoutTags/);
  assert.match(browser, /organization_id/);
  assert.ok(pathExists("src/lib/fastspring/org-matching.ts"));
  const orgMatching = readSource("src/lib/fastspring/org-matching.ts");
  assert.match(orgMatching, /organization_id/);
});
