/**
 * Legacy billing provider eradication — active-surface guards and Mollie-first contracts.
 * Excludes historical migrations and archival docs. Active FastSpring runtime must stay deleted.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { pathExists, readSource } from "./_test-helpers/read-source.mjs";

const ACTIVE_UI_FILES = [
  "src/components/settings/billing-diagnostics-panel.tsx",
  "src/components/settings/billing-maintenance-actions.tsx",
  "src/components/settings/billing-settings-panel.tsx",
  "src/components/settings/diagnostics-panel.tsx",
  "src/components/pricing/pricing-grid.tsx",
  "src/components/pricing/pricing-card.tsx",
  "src/components/billing/checkout-block-banner.tsx",
  "src/components/settings/invoice-center-panel.tsx",
];

const LEGACY_PROVIDER_UI_PATTERN = /\b(stripe|paddle|fastspring)\b/i;

function extractUserFacingStringLiterals(source) {
  const literals = [];
  const patterns = [
    /\b(?:title|label|description|message|placeholder)=["']([^"']+)["']/g,
    />\s*([^<{][^<{}]*?\b(?:Stripe|Paddle|FastSpring|stripe|paddle|fastspring)[^<{}]*?)\s*</g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      literals.push(match[1].trim());
    }
  }

  return literals;
}

test("active billing UI surfaces contain no legacy provider brand strings", () => {
  for (const file of ACTIVE_UI_FILES) {
    const source = readSource(file);
    const literals = extractUserFacingStringLiterals(source);
    for (const literal of literals) {
      assert.doesNotMatch(
        literal,
        LEGACY_PROVIDER_UI_PATTERN,
        `${file} exposes legacy provider branding in UI copy: "${literal}"`,
      );
    }
  }
});

test("retired FastSpring test checkout panel is not mounted on active settings routes", () => {
  const page = readSource("src/app/(dashboard)/settings/billing/fastspring-test/page.tsx");
  assert.match(page, /redirect\("\/settings\/billing\/mollie-test"\)/);
  assert.doesNotMatch(page, /FastSpringTestCheckoutPanel/);

  const billingPage = readSource("src/app/(dashboard)/settings/billing/page.tsx");
  assert.doesNotMatch(billingPage, /fastspring-test-checkout-panel|FastSpringTestCheckoutPanel/);
});

test("legacy provider API routes return 410 with provider-neutral messages", () => {
  const webhook = readSource("src/app/api/fastspring/webhook/route.ts");
  const connectivity = readSource("src/app/api/fastspring/connectivity/route.ts");
  assert.match(webhook, /status:\s*410/);
  assert.match(connectivity, /status:\s*410/);
  assert.doesNotMatch(webhook, /FastSpring webhooks are retired/);
  assert.doesNotMatch(connectivity, /FastSpring API connectivity is retired/);
  assert.match(webhook, /Legacy provider webhooks are retired/);
  assert.match(connectivity, /Legacy provider API connectivity is retired/);
});

test("Mollie hygiene does not require legacy stripe_customer_id for active subscriptions", () => {
  const hygiene = readSource("src/lib/billing/hygiene.ts");
  assert.match(hygiene, /isMollieBackedSubscription/);
  assert.match(hygiene, /provider customer reference is missing/);
  assert.match(hygiene, /provider subscription reference is missing/);
  assert.doesNotMatch(hygiene, /stripe_customer_id is missing/);
  assert.doesNotMatch(hygiene, /stripe_subscription_id is missing/);
});

test("billing production diagnostics are Mollie-first", () => {
  const diagnostics = readSource("src/lib/billing/production-diagnostics.ts");
  assert.match(diagnostics, /hasMollieSubscriptionId/);
  assert.match(diagnostics, /mollieCheckoutBlocked/);
  assert.match(diagnostics, /hasVerifiedMollieSubscription/);
  assert.doesNotMatch(diagnostics, /hasFastSpringSubscriptionId/);
  assert.doesNotMatch(diagnostics, /fastspringCheckoutBlocked/);
});

test("platform status snapshot is Mollie-first — no FastSpring/Paddle operator tiles", () => {
  const status = readSource("src/lib/diagnostics/platform-status.ts");
  assert.match(status, /checkMollieApiConfigHealth/);
  assert.match(status, /label: "Mollie API"/);
  assert.match(status, /label: "Legacy billing archive"/);
  assert.doesNotMatch(status, /label: "FastSpring/);
  assert.doesNotMatch(status, /label: "Legacy billing \(Paddle\)/);
});

test("checkout eligibility never falls back to legacy providers", () => {
  const eligibility = readSource("src/lib/billing/checkout-eligibility.ts");
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /return "mollie"/);
  assert.doesNotMatch(eligibility, /allowed_fastspring|isFastSpringCheckoutConfigured/);
  assert.match(eligibility, /provider:\s*"mollie"/);
});

test("global workspace search has no legacy billing provider actions", () => {
  const search = readSource("src/lib/layout/workspace-search.ts");
  assert.doesNotMatch(search, LEGACY_PROVIDER_UI_PATTERN);
});

test("auth session cookie RSC fix remains intact", () => {
  const server = readSource("src/lib/supabase/server.ts");
  assert.match(server, /createSupabaseServerClient\(false\)/);
  assert.match(server, /export async function createWritableClient\(\)/);

  const session = readSource("src/lib/auth/session.ts");
  const readBlock = session.slice(
    session.indexOf("export async function readSessionContext"),
    session.indexOf("export async function readSessionContextFromRequest"),
  );
  assert.doesNotMatch(readBlock, /cookieStore\.set/);
});

test("MOLLIE_LIVE_CHARGING_ENABLED gate remains fail-closed", () => {
  const rollout = readSource("src/lib/billing/providers/mollie/rollout.ts");
  assert.match(rollout, /MOLLIE_LIVE_CHARGING_ENABLED/);
  assert.match(rollout, /isMollieLiveChargingEnabled/);
});

test("no Paddle SDK packages or active paddle API routes", () => {
  const pkg = readSource("package.json");
  assert.doesNotMatch(pkg, /"@paddle\//);
  assert.equal(pathExists("src/app/api/paddle"), false);
  assert.equal(pathExists("src/lib/paddle"), false);
});

const ACTIVE_OPERATOR_DOCS = [
  "docs/enterprise-production-golive-playbook.md",
  "docs/enterprise-deployment.md",
  "docs/enterprise-release-checklist.md",
  "docs/operations-runbook.md",
  "docs/rollback-plan.md",
  "docs/disaster-recovery.md",
  "docs/billing.md",
  "docs/abuse-protection.md",
  "docs/vercel-checklist.md",
];

/** Affirmative ops instructions that would treat legacy providers as current. */
const ACTIVE_LEGACY_OPS_PATTERNS = [
  /(?:^|[^\w])Register FastSpring webhook:/im,
  /(?:^|[^\w])Register Paddle webhook:/im,
  /(?:^|[^\w])Register Stripe webhook:/im,
  /PADDLE_ENVIRONMENT\s*=\s*production/i,
  /\/api\/paddle\/webhook/,
  /\/api\/stripe\/webhook/,
  /Billing validation \(FastSpring\)/,
  /Webhook rollback \(FastSpring\)/,
  /getActiveBillingProvider\(\)\s*returns\s*[`"]fastspring[`"]/i,
  /uses \*\*FastSpring as the sole active billing provider\*\*/i,
  /Billing:\*\* FastSpring only/i,
];

test("canonical operator/go-live docs do not instruct active Stripe/Paddle/FastSpring ops", () => {
  for (const file of ACTIVE_OPERATOR_DOCS) {
    const source = readSource(file);
    for (const pattern of ACTIVE_LEGACY_OPS_PATTERNS) {
      assert.doesNotMatch(
        source,
        pattern,
        `${file} contains active legacy billing ops guidance matching ${pattern}`,
      );
    }
    assert.match(source, /Mollie/i, `${file} should name Mollie as current billing`);
  }

  const playbook = readSource("docs/enterprise-production-golive-playbook.md");
  assert.match(playbook, /\/api\/mollie\/webhook/);
  assert.match(playbook, /MOLLIE_LIVE_CHARGING_ENABLED=false/);
  assert.doesNotMatch(playbook, /Paddle Live configuration|Paddle live keys|\/api\/paddle\/webhook/);

  const historical = readSource("docs/paddle-billing.md");
  assert.match(historical, /STATUS:\s*HISTORICAL\s*\/\s*SUPERSEDED/i);
  assert.match(historical, /CURRENT BILLING PROVIDER:\s*MOLLIE/i);
});

/** Public legal + in-product docs that render on www (not historical operator archives). */
const PUBLIC_BILLING_CONTENT_FILES = [
  "src/lib/company/legal-content.ts",
  "src/lib/company/company-schema.ts",
  "src/lib/docs/pages/account.ts",
  "src/lib/docs/pages/operations.ts",
  "src/lib/marketing/content.ts",
  "src/lib/marketing/integrations-catalog.ts",
];

const PUBLIC_ACTIVE_LEGACY_PROVIDER_PATTERN =
  /\b(Stripe|Paddle|FastSpring)\b|Merchant of Record|\bMoR\b/;

test("public legal and docs sources name Mollie — no active Stripe/Paddle/FastSpring/MoR claims", () => {
  for (const file of PUBLIC_BILLING_CONTENT_FILES) {
    const source = readSource(file);
    assert.doesNotMatch(
      source,
      PUBLIC_ACTIVE_LEGACY_PROVIDER_PATTERN,
      `${file} must not present Stripe/Paddle/FastSpring or MoR as current public billing facts`,
    );
  }

  const legal = readSource("src/lib/company/legal-content.ts");
  assert.match(legal, /payment service provider, Mollie/);
  assert.match(legal, /subprocessors-inventory/);
  const inventory = readSource("src/lib/company/subprocessors-inventory.ts");
  assert.match(inventory, /Mollie/);
  assert.match(inventory, /Payment processing for subscription billing/i);
  assert.doesNotMatch(legal, /Merchant of Record/i);
  // Inventory may factually negate MoR ("not Merchant of Record") — that is allowed.

  const billingDoc = readSource("src/lib/docs/pages/account.ts");
  assert.match(billingDoc, /Auroranexis is the seller for subscriptions/);
  assert.match(billingDoc, /Mollie is the payment service provider/);
  assert.match(billingDoc, /Mollie does not provide a hosted billing portal/);
  assert.match(billingDoc, /Auroranexis remains the seller, issues sales invoices/);
  assert.doesNotMatch(billingDoc, /billed through Mollie/);
  assert.doesNotMatch(billingDoc, /customer portal/i);
  assert.doesNotMatch(billingDoc, /account management link/i);

  const gettingStarted = readSource("src/lib/docs/pages/operations.ts");
  assert.match(gettingStarted, /Mollie as payment service provider/);
  assert.match(gettingStarted, /Auroranexis remains the seller/);

  const marketing = readSource("src/lib/marketing/content.ts");
  assert.match(marketing, /Subscription billing available/);
  assert.doesNotMatch(marketing, /Mollie subscriptions and invoices/);

  const integrations = readSource("src/lib/marketing/integrations-catalog.ts");
  assert.match(integrations, /Payment processing for Auroranexis subscription checkout and settlement/);
  assert.doesNotMatch(integrations, /invoice sync/i);
});

test("llms.txt and legal aliases stay public — never auth-gated", () => {
  const staticAssets = readSource("src/lib/deployment/middleware-routing.ts");
  assert.match(staticAssets, /pathname === "\/llms\.txt"/);

  const sessionMw = readSource("src/lib/supabase/middleware.ts");
  assert.match(sessionMw, /pathname === "\/llms\.txt"/);
  assert.match(sessionMw, /pathname === "\/sub-processors"/);
  assert.match(sessionMw, /pathname === "\/dpa"/);

  const marketingPaths = readSource("src/lib/deployment/domain-routing.ts");
  assert.match(marketingPaths, /pathname === "\/llms\.txt"/);

  const subAlias = readSource("src/app/(marketing)/sub-processors/page.tsx");
  assert.match(subAlias, /permanentRedirect\("\/subprocessors"\)/);

  const dpaAlias = readSource("src/app/(marketing)/dpa/page.tsx");
  assert.match(dpaAlias, /permanentRedirect\("\/data-processing-agreement"\)/);

  const vercel = readSource("vercel.json");
  assert.match(vercel, /"source":\s*"\/sub-processors"/);
  assert.match(vercel, /"destination":\s*"\/subprocessors"/);
  assert.match(vercel, /"source":\s*"\/dpa"/);
  assert.match(vercel, /"destination":\s*"\/data-processing-agreement"/);
});

test("public legal routes render from LEGAL_PAGES — not duplicate hardcoded Stripe/Paddle copy", () => {
  const legalPageView = readSource("src/components/marketing/legal-page-view.tsx");
  assert.match(legalPageView, /LEGAL_PAGES/);
  assert.match(legalPageView, /LegalPageView/);

  for (const route of [
    "src/app/(marketing)/terms/page.tsx",
    "src/app/(marketing)/privacy/page.tsx",
    "src/app/(marketing)/refund-policy/page.tsx",
    "src/app/(marketing)/imprint/page.tsx",
    "src/app/(marketing)/subprocessors/page.tsx",
  ]) {
    const page = readSource(route);
    assert.match(page, /LegalPageView/);
    assert.doesNotMatch(page, PUBLIC_ACTIVE_LEGACY_PROVIDER_PATTERN);
  }
});

test("ACTIVE FastSpring runtime modules and test UI are eradicated (410 tombstones only)", () => {
  assert.equal(pathExists("src/lib/fastspring"), false);
  assert.equal(pathExists("src/components/settings/fastspring-test-checkout-panel.tsx"), false);
  assert.equal(pathExists("src/lib/stripe"), false);
  assert.equal(pathExists("src/lib/paddle"), false);
  assert.equal(pathExists("src/app/api/stripe"), false);
  assert.equal(pathExists("src/app/api/paddle"), false);
  assert.ok(pathExists("src/app/api/fastspring/webhook/route.ts"));
  assert.ok(pathExists("src/app/api/fastspring/connectivity/route.ts"));
  assert.ok(pathExists("src/app/api/mollie/webhook/route.ts"));

  const pkg = readSource("package.json");
  assert.doesNotMatch(pkg, /"test:fastspring-/);
  assert.doesNotMatch(pkg, /"@paddle\//);
  assert.doesNotMatch(pkg, /"stripe"/);
  assert.match(pkg, /"@mollie\/api-client"/);

  const envExample = readSource(".env.example");
  assert.doesNotMatch(envExample, /^[#\s]*FASTSPRING_[A-Z0-9_]+=/m);
  assert.doesNotMatch(envExample, /^[#\s]*PADDLE_[A-Z0-9_]+=/m);
  assert.doesNotMatch(envExample, /^[#\s]*STRIPE_[A-Z0-9_]+=/m);
  assert.doesNotMatch(envExample, /^[#\s]*NEXT_PUBLIC_STRIPE_/m);
  assert.doesNotMatch(envExample, /^[#\s]*NEXT_PUBLIC_PADDLE_/m);
  assert.match(envExample, /MOLLIE_LIVE_CHARGING_ENABLED=false/);
});

test("getActiveBillingProvider is Mollie-only — ACTIVE_* legacy providers = 0", () => {
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /return "mollie"/);
  assert.doesNotMatch(provider, /return "fastspring"/);
  assert.doesNotMatch(provider, /return "paddle"/);
  assert.doesNotMatch(provider, /return "stripe"/);
  assert.match(provider, /isFastSpringActiveBillingProvider[\s\S]*return false/);
});

test("checkout-block defaults to Mollie and never bypasses invoice guards via FastSpring", () => {
  const block = readSource("src/lib/billing/checkout-block.ts");
  assert.match(block, /input\.activeProvider \?\? "mollie"/);
  assert.doesNotMatch(block, /\?\? "fastspring"/);
  assert.doesNotMatch(block, /activeProvider === "fastspring"/);
  assert.match(block, /OPEN_INVOICE_CHECKOUT_BLOCK_MESSAGE/);

  const grid = readSource("src/components/pricing/pricing-grid.tsx");
  assert.match(grid, /activeProvider:\s*"mollie"/);
});

test("public health snapshot publishes Mollie only — no legacy provider config aliases", () => {
  const health = readSource("src/lib/observability/health.ts");
  assert.match(health, /mollie:\s*mollieConfigured/);
  assert.doesNotMatch(health, /fastspring:\s*mollieConfigured/);
  assert.doesNotMatch(health, /paddle:\s*mollieConfigured/);
  assert.doesNotMatch(health, /stripe:\s*mollieConfigured/);

  const centerTypes = readSource("src/lib/integrations/center/types.ts");
  assert.doesNotMatch(centerTypes, /fastspring:\s*IntegrationCenterMollie/);
  const centerSnap = readSource("src/lib/integrations/center/snapshot.ts");
  assert.doesNotMatch(centerSnap, /fastspring:\s*mollieBilling/);

  const vercel = readSource("src/lib/diagnostics/vercel-production-readiness.ts");
  assert.doesNotMatch(vercel, /fastspringEnvReady/);
  assert.doesNotMatch(vercel, /fastspring:\s*\[\]/);
});

test("ACTIVE eradication surfaces stay free of unexplained legacy provider brands", () => {
  const files = [
    "src/lib/billing/checkout-block.ts",
    "src/lib/billing/provider.ts",
    "src/lib/observability/health.ts",
    "src/lib/integrations/center/types.ts",
    "src/lib/integrations/center/snapshot.ts",
    "src/lib/diagnostics/vercel-production-readiness.ts",
    "src/components/pricing/pricing-grid.tsx",
  ];
  for (const file of files) {
    const source = readSource(file);
    for (const line of source.split("\n")) {
      if (!/\b(Stripe|Paddle|FastSpring|stripe|paddle|fastspring)\b/.test(line)) continue;
      const justified =
        /retired|legacy|historical|quarantine|410|Gone|@deprecated|sole active|never|Mollie|tombstone|archive|compat|DB column|field name/i.test(
          line,
        ) ||
        /stripeInvoiceId|ignoredStripeInvoiceIds|blockingInvoiceStripeId|maskStripeId|stripeStatus|stripe_/i.test(
          line,
        ) ||
        /isFastSpringActiveBillingProvider|LEGACY_BILLING|billing_provider|BillingProvider|mapFastSpring|api\/fastspring/i.test(
          line,
        );
      assert.ok(justified, `${file} unexplained legacy line: ${line.trim()}`);
    }
  }
});
