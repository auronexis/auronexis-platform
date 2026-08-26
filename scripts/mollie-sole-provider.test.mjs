/**
 * Mollie sole-provider consolidation proofs.
 * Replaces obsolete FastSpring sole-provider / Price-API expectations.
 *
 * Source-contract style via readSource — does not import server-only modules.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { pathExists, readSource } from "./_test-helpers/read-source.mjs";

test("getActiveBillingProvider returns mollie and never paddle/stripe/fastspring", () => {
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /export function getActiveBillingProvider\(\)/);
  assert.match(provider, /return "mollie"/);
  assert.doesNotMatch(provider, /return "paddle"/);
  assert.doesNotMatch(provider, /return "stripe"/);
  assert.doesNotMatch(provider, /return "fastspring"/);
});

test("settings/plans does not import FastSpring pricing or country helpers", () => {
  const page = readSource("src/app/(dashboard)/settings/plans/page.tsx");
  assert.doesNotMatch(page, /@\/lib\/fastspring/);
  assert.doesNotMatch(page, /getPublicLocalizedPrices/);
  assert.doesNotMatch(page, /resolveRequestBillingCountry/);
  assert.match(page, /getCatalogDisplayPriceMap/);
  assert.match(page, /@\/lib\/billing\/display-pricing/);
});

test("public pricing uses catalog display prices — no FastSpring Price API", () => {
  const publicPricing = readSource("src/lib/marketing/public-pricing.ts");
  assert.match(publicPricing, /getCatalogDisplayPrices/);
  assert.doesNotMatch(publicPricing, /@\/lib\/fastspring/);
  assert.doesNotMatch(publicPricing, /getPublicLocalizedPrices/);

  const display = readSource("src/lib/billing/display-pricing.ts");
  assert.match(display, /catalog_eur/);
  assert.doesNotMatch(display, /fastSpringApiFetch|api\.fastspring\.com/);
});

test("pricing grid has no FastSpring browser checkout", () => {
  const grid = readSource("src/components/pricing/pricing-grid.tsx");
  assert.doesNotMatch(grid, /openFastSpringCheckout|@\/lib\/fastspring\/browser-checkout/);
  assert.doesNotMatch(grid, /fastspringCheckout/);
  assert.match(grid, /mollieCheckout/);
});

test("checkout actions never build FastSpring payloads", () => {
  const actions = readSource("src/lib/billing/actions.ts");
  assert.doesNotMatch(actions, /createFastSpringCheckoutPayload|@\/lib\/fastspring\/checkout/);
  assert.doesNotMatch(actions, /fastspringCheckout/);
  assert.match(actions, /createMollieProductionFirstPayment|mollieCheckout/);
});

test("FastSpring webhook and connectivity routes return 410 Gone", () => {
  const webhook = readSource("src/app/api/fastspring/webhook/route.ts");
  const connectivity = readSource("src/app/api/fastspring/connectivity/route.ts");
  assert.match(webhook, /status:\s*410/);
  assert.match(connectivity, /status:\s*410/);
  assert.match(webhook, /Legacy provider webhooks are retired/);
  assert.doesNotMatch(webhook, /handleFastSpringWebhookEvent|verifyFastSpring/);
  assert.doesNotMatch(connectivity, /probeFastSpringApiConnectivity/);
});

test("CSP and vercel.json do not allow onfastspring.com hosts", () => {
  const csp = readSource("src/lib/security/csp.ts");
  const vercel = readSource("vercel.json");
  assert.doesNotMatch(csp, /onfastspring\.com/);
  assert.doesNotMatch(vercel, /onfastspring\.com/);
});

test("Mollie webhook remains the active public billing webhook", () => {
  assert.ok(pathExists("src/app/api/mollie/webhook/route.ts"));
  const endpoints = readSource("src/lib/security/public-endpoints.ts");
  assert.match(endpoints, /\/api\/mollie\/webhook/);
  assert.doesNotMatch(endpoints, /\/api\/fastspring\/webhook/);
});

test("checkout eligibility never allows FastSpring checkout", () => {
  const eligibility = readSource("src/lib/billing/checkout-eligibility.ts");
  assert.doesNotMatch(eligibility, /allowed_fastspring|isFastSpringCheckoutConfigured/);
  assert.match(eligibility, /historical_provider_retired/);
  assert.match(eligibility, /provider:\s*"mollie"/);
});

test("LIVE charging remains gated off by default in rollout module", () => {
  const rollout = readSource("src/lib/billing/providers/mollie/rollout.ts");
  assert.match(rollout, /isMollieLiveChargingEnabled/);
  assert.match(rollout, /MOLLIE_LIVE_CHARGING_ENABLED/);
});

test(".env.example documents Mollie sole provider without legacy env keys", () => {
  const envExample = readSource(".env.example");
  assert.match(envExample, /MOLLIE_API_KEY/);
  assert.match(envExample, /sole active billing/i);
  assert.doesNotMatch(envExample, /^FASTSPRING_/m);
  assert.doesNotMatch(envExample, /^#\s*FASTSPRING_/m);
  assert.doesNotMatch(envExample, /^PADDLE_/m);
  assert.doesNotMatch(envExample, /^STRIPE_/m);
  assert.equal(pathExists("src/lib/fastspring"), false);
});

test("no Paddle SDK imports remain in src/", () => {
  const pkg = readSource("package.json");
  assert.doesNotMatch(pkg, /"@paddle\/paddle-js"/);
  assert.doesNotMatch(pkg, /"@paddle\/paddle-node-sdk"/);
  assert.equal(pathExists("src/lib/paddle"), false);
  assert.equal(pathExists("src/app/api/paddle"), false);
});
