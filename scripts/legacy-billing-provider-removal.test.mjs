/**
 * Legacy billing provider eradication — active-surface guards and Mollie-first contracts.
 * Excludes historical migrations, archival docs, and retired src/lib/fastspring modules.
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
