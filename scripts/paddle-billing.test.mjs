import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

test("paddle packages are installed for Billing (not Classic)", () => {
  const pkg = JSON.parse(readSource("package.json"));
  assert.ok(pkg.dependencies["@paddle/paddle-node-sdk"]);
  assert.ok(pkg.dependencies["@paddle/paddle-js"]);
});

test("billing provider abstraction exists and defaults safely", () => {
  const provider = readSource("src/lib/billing/provider.ts");
  const types = readSource("src/lib/billing/provider-types.ts");
  assert.match(provider, /BILLING_PROVIDER/);
  assert.match(provider, /return "stripe"/);
  assert.match(types, /BillingProvider = "stripe" \| "paddle"/);
  assert.match(types, /InternalPlan/);
});

test("paddle price mapping fails closed and does not invent pri_ IDs", () => {
  const prices = readSource("src/lib/paddle/prices.ts");
  assert.match(prices, /PADDLE_PRICE_PROFESSIONAL_MONTHLY/);
  assert.match(prices, /PADDLE_PRICE_BUSINESS_MONTHLY/);
  assert.match(prices, /Unknown Paddle price ID/);
  assert.match(prices, /startsWith\("pri_"\)/);
  assert.doesNotMatch(prices, /pri_[a-zA-Z0-9]{8,}/);
});

test("paddle secrets stay server-only", () => {
  const env = readSource("src/lib/paddle/env.ts");
  const browser = readSource("src/lib/paddle/browser-checkout.ts");
  assert.match(env, /PADDLE_API_KEY/);
  assert.match(env, /PADDLE_WEBHOOK_SECRET/);
  assert.match(env, /server-only/);
  assert.doesNotMatch(browser, /PADDLE_API_KEY/);
  assert.doesNotMatch(browser, /PADDLE_WEBHOOK_SECRET/);
  assert.match(browser, /NEXT_PUBLIC_PADDLE_CLIENT_TOKEN|clientToken/);
});

test("paddle webhook verifies raw body signature before processing", () => {
  const route = readSource("src/app/api/paddle/webhook/route.ts");
  assert.match(route, /request\.text\(\)/);
  assert.match(route, /paddle-signature/i);
  assert.match(route, /webhooks\.unmarshal/);
  assert.match(route, /status: 400/);
  assert.match(route, /ensurePaddleIdempotency/);
});

test("paddle webhook idempotency uses provider + event id unique constraint", () => {
  const migration = readSource("supabase/migrations/20250717000000_paddle_billing.sql");
  const idem = readSource("src/lib/paddle/idempotency.ts");
  assert.match(migration, /paddle_webhook_events/);
  assert.match(migration, /UNIQUE \(provider, provider_event_id\)/);
  assert.match(idem, /duplicate/);
  assert.match(idem, /payload_hash/);
});

test("additive migration preserves stripe columns", () => {
  const migration = readSource("supabase/migrations/20250717000000_paddle_billing.sql");
  assert.match(migration, /billing_provider/);
  assert.match(migration, /provider_customer_id/);
  assert.doesNotMatch(migration, /DROP COLUMN.*stripe_customer_id/);
  assert.doesNotMatch(migration, /DROP TABLE.*customer_invoices/);
  assert.match(migration, /billing_provider_transactions/);
});

test("checkout and portal route by billing provider", () => {
  const actions = readSource("src/lib/billing/actions.ts");
  const portal = readSource("src/lib/billing/customer-portal.ts");
  const checkout = readSource("src/lib/paddle/checkout.ts");
  assert.match(actions, /getActiveBillingProvider/);
  assert.match(actions, /createPaddleCheckoutPayload/);
  assert.match(actions, /paddleCheckout/);
  assert.match(portal, /createPaddlePortalSession/);
  assert.match(portal, /getActiveBillingProvider/);
  assert.match(portal, /provider === "paddle"/);
  assert.match(checkout, /markOrganizationSyncPending|pendingSyncMessage/);
  assert.match(checkout, /organization_id/);
  assert.match(checkout, /schema_version/);
});

test("custom checkout data excludes secrets", () => {
  const types = readSource("src/lib/billing/provider-types.ts");
  assert.match(types, /organization_id/);
  assert.match(types, /initiating_user_id/);
  assert.match(types, /internal_plan/);
  assert.doesNotMatch(types, /api_key|webhook_secret|password/i);
});

test("stripe webhook routes remain intact", () => {
  assert.ok(existsSync(join(rootDir, "src/app/api/stripe/webhook/route.ts")));
  assert.ok(existsSync(join(rootDir, "src/app/api/stripe/webhook-v2/route.ts")));
  const stripeWebhook = readSource("src/app/api/stripe/webhook/route.ts");
  assert.match(stripeWebhook, /constructEvent/);
});

test("refund policy appears in legal nav and footer routes", () => {
  const links = readSource("src/lib/company/company-links.ts");
  const nav = readSource("src/lib/marketing/content.ts");
  const refundPage = readSource("src/app/(marketing)/refund-policy/page.tsx");
  const termsPage = readSource("src/app/(marketing)/terms/page.tsx");
  const legal = readSource("src/lib/company/legal-content.ts");
  assert.match(links, /refundPolicy: "\/refund-policy"/);
  assert.match(links, /Refund Policy/);
  assert.match(nav, /Refund Policy/);
  assert.match(nav, /LEGAL_ROUTES\.refundPolicy/);
  assert.match(refundPage, /refundPolicy/);
  assert.match(termsPage, /pageKey="terms"/);
  assert.match(legal, /Paddle as Merchant of Record/);
  assert.match(legal, /Refund and Cancellation Policy/);
  assert.match(legal, /paddle\.com\/legal\/checkout-buyer-terms/);
  assert.match(legal, /paddle\.com\/legal\/refund-policy/);
});

test("legal layout uses safe external link attributes for paddle URLs", () => {
  const layout = readSource("src/components/legal/legal-layout.tsx");
  assert.match(layout, /rel="noopener noreferrer"/);
  assert.match(layout, /target="_blank"/);
});

test("CSP allows minimum official Paddle domains", () => {
  const csp = readSource("src/lib/security/csp.ts");
  const vercel = readSource("vercel.json");
  for (const domain of [
    "cdn.paddle.com",
    "sandbox-cdn.paddle.com",
    "api.paddle.com",
    "sandbox-api.paddle.com",
    "buy.paddle.com",
    "sandbox-buy.paddle.com",
  ]) {
    assert.match(csp, new RegExp(domain.replace(/\./g, "\\.")));
    assert.match(vercel, new RegExp(domain.replace(/\./g, "\\.")));
  }
});

test("env example documents paddle names without secret values", () => {
  const envExample = readSource(".env.example");
  assert.match(envExample, /BILLING_PROVIDER/);
  assert.match(envExample, /PADDLE_API_KEY=/);
  assert.match(envExample, /PADDLE_WEBHOOK_SECRET=/);
  assert.match(envExample, /NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=/);
  assert.match(envExample, /PADDLE_ENVIRONMENT=sandbox/);
  const paddleBlock = envExample.slice(envExample.indexOf("# Billing provider switch"));
  assert.doesNotMatch(paddleBlock, /pdl_[a-zA-Z0-9]|pri_[a-zA-Z0-9]{6,}/);
});

test("subscription status mapping preserves raw paddle status separately", () => {
  const status = readSource("src/lib/paddle/status.ts");
  const sync = readSource("src/lib/paddle/sync.ts");
  assert.match(status, /mapPaddleSubscriptionStatus/);
  assert.match(sync, /provider_status/);
  assert.match(sync, /billing_provider: "paddle"/);
  assert.match(sync, /refusing to overwrite Stripe/);
  assert.match(sync, /stripe_subscription_id/);
});

test("paddle mode ignores stale Stripe incomplete rows for checkout and selection", () => {
  const active = readSource("src/lib/billing/active-billing.ts");
  const selection = readSource("src/lib/billing/subscription-selection.ts");
  const block = readSource("src/lib/billing/checkout-block.ts");
  const overview = readSource("src/lib/billing/types.ts");
  const portal = readSource("src/lib/billing/customer-portal.ts");
  const paddlePortal = readSource("src/lib/paddle/portal.ts");
  const diagnostics = readSource("src/components/settings/billing-diagnostics-panel.tsx");
  const maintenance = readSource("src/lib/billing/maintenance.ts");
  const maintenanceUi = readSource("src/components/settings/billing-maintenance-actions.tsx");
  const entitlements = readSource("src/lib/entitlements/resolver.ts");

  assert.match(active, /isStaleStripeAbandonedCheckout/);
  assert.match(active, /resolveActiveBillingStatusFlags/);
  assert.match(active, /hasVerifiedPaddleCustomer/);
  assert.match(active, /PADDLE_PORTAL_UNAVAILABLE_MESSAGE/);
  assert.match(selection, /activeProvider === "paddle"/);
  assert.match(selection, /do not fall back to stale Stripe/i);
  assert.match(block, /activeProvider === "paddle"/);
  assert.match(block, /Stripe open invoices and incomplete Stripe rows never block/);
  assert.match(overview, /resolveActiveBillingStatusFlags/);
  assert.match(portal, /getActiveBillingProvider/);
  assert.doesNotMatch(portal, /billing_provider.*\?\? "stripe"/);
  assert.match(paddlePortal, /hasVerifiedPaddleCustomer/);
  assert.match(paddlePortal, /Never falls back to Stripe/);
  assert.match(diagnostics, /Legacy Stripe history/);
  assert.match(diagnostics, /Paddle is the active billing provider/);
  assert.match(diagnostics, /isPaddleMode/);
  assert.doesNotMatch(
    diagnostics,
    /Stripe remains the source of truth\. Customer-facing billing remains on/,
  );
  assert.match(maintenance, /neutralizeStaleStripeCheckoutRemnants/);
  assert.match(maintenance, /abandoned_stripe_checkout/);
  assert.match(maintenanceUi, /Neutralize stale Stripe checkout remnants/);
  assert.match(maintenanceUi, /Stripe sync actions are disabled/);
  assert.match(entitlements, /getActiveBillingProvider/);
  assert.match(entitlements, /isPaddleBackedSubscription/);
});

test("paddle portal requires verified Paddle customer and never uses Stripe customer id", () => {
  const status = readSource("src/lib/billing/status.ts");
  const panel = readSource("src/components/settings/billing-settings-panel.tsx");
  const active = readSource("src/lib/billing/active-billing.ts");
  assert.match(status, /activeProvider === "paddle"/);
  assert.match(status, /ctm_/);
  assert.match(active, /startsWith\("ctm_"\)/);
  assert.match(panel, /A billing portal will be available after your first completed subscription/);
  assert.match(panel, /activeProvider/);
});

test("unknown paddle price and status fail closed for entitlements", () => {
  const prices = readSource("src/lib/paddle/prices.ts");
  const paddleStatus = readSource("src/lib/paddle/status.ts");
  const sync = readSource("src/lib/paddle/sync.ts");
  assert.match(prices, /Unknown Paddle price ID/);
  assert.match(paddleStatus, /default:\s*return "inactive"/);
  assert.match(sync, /resolveInternalPlanFromPaddlePriceId/);
  assert.match(sync, /Fail closed/);
});
