/**
 * Mollie Phase 3 — production billing integration / provider abstraction /
 * safe cutover preparation. Source-contract suite (categories A–R).
 */
import assert from "node:assert/strict";
import test from "node:test";
import { pathExists, readSource } from "./_test-helpers/read-source.mjs";

// A — Architecture / provider selection
test("A: getActiveBillingProvider remains fastspring — no global Mollie switch", () => {
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /return "fastspring"/);
  assert.doesNotMatch(provider, /return "mollie"/);
});

test("A: per-org provider resolution exists with FastSpring coexistence guards", () => {
  const selection = readSource("src/lib/billing/provider-selection.ts");
  assert.match(selection, /resolveOrganizationBillingProvider/);
  assert.match(selection, /fastspring_blocks_mollie/);
  assert.match(selection, /mollie_allowlist_eligible/);
  assert.match(selection, /existing_mollie_subscription/);
  assert.match(selection, /No silent migration/);
});

test("A: rollout flags — allowlist + master switch + live charging gate", () => {
  const rollout = readSource("src/lib/billing/providers/mollie/rollout.ts");
  assert.match(rollout, /MOLLIE_BILLING_ROLLOUT/);
  assert.match(rollout, /MOLLIE_BILLING_ORG_ALLOWLIST/);
  assert.match(rollout, /MOLLIE_LIVE_CHARGING_ENABLED/);
  assert.match(rollout, /isMollieProductionCheckoutEligible/);
  const envExample = readSource(".env.example");
  assert.match(envExample, /MOLLIE_BILLING_ROLLOUT/);
  assert.match(envExample, /MOLLIE_BILLING_ORG_ALLOWLIST/);
  assert.match(envExample, /MOLLIE_LIVE_CHARGING_ENABLED/);
});

// B — Canonical contract / status normalization
test("B: Mollie status mapping — active/canceled/past_due/inactive; suspended→past_due", () => {
  const statusMap = readSource("src/lib/billing/providers/mollie/lifecycle-status.ts");
  assert.match(statusMap, /mapMollieSubscriptionStatus/);
  assert.match(statusMap, /case "active"/);
  assert.match(statusMap, /case "suspended"/);
  assert.match(statusMap, /return "past_due"/);
  assert.match(statusMap, /case "completed"/);
  assert.match(statusMap, /return "inactive"/);
  const checkout = readSource("src/lib/billing/providers/mollie/checkout.ts");
  assert.match(checkout, /mapMollieSubscriptionStatus/);
  assert.match(checkout, /lifecycle-status/);
});

test("B: organization_subscriptions is Mollie production persistence target", () => {
  const orgSync = readSource("src/lib/billing/providers/mollie/organization-sync.ts");
  assert.match(orgSync, /organization_subscriptions/);
  assert.match(orgSync, /billing_provider: "mollie"/);
  assert.match(orgSync, /assertCanWriteMollieOrganizationSubscription/);
  assert.match(orgSync, /No silent migration/);
});

// C — Entitlements
test("C: entitlements resolve Mollie via org provider; FastSpring path preserved", () => {
  const entitlements = readSource("src/lib/entitlements/resolver.ts");
  assert.match(entitlements, /getOrganizationBillingProvider/);
  assert.match(entitlements, /isMollieBackedSubscription/);
  assert.match(entitlements, /isFastSpringBackedSubscription/);
  assert.match(entitlements, /Return-page callbacks never activate/);
  const plansServer = readSource("src/lib/billing/plans.server.ts");
  assert.match(plansServer, /billingProvider === "mollie"/);
  assert.match(plansServer, /professional.*business|priceId === "professional"/);
});

test("C: usable statuses only grant paid access (active/trialing)", () => {
  const status = readSource("src/lib/billing/status.ts");
  assert.match(status, /USABLE_STATUSES = new Set\(\["active", "trialing"\]\)/);
});

// D — Checkout production path
test("D: production checkout writes organization_subscriptions; TEST surface separate", () => {
  const prod = readSource("src/lib/billing/providers/mollie/production-checkout.ts");
  assert.match(prod, /createMollieProductionFirstPayment/);
  assert.match(prod, /SequenceType\.first/);
  assert.match(prod, /upsertMollieOrganizationSubscription/);
  assert.match(prod, /MOLLIE_METADATA_BILLING_SURFACE.*production/);
  assert.match(prod, /getPlanByKey/);
  assert.match(prod, /assertMolliePaymentOpsAllowed/);
  assert.match(prod, /never mollie_test_subscriptions/i);
});

test("D: Enterprise excluded from Mollie self-serve", () => {
  const checkout = readSource("src/lib/billing/providers/mollie/checkout.ts");
  assert.match(checkout, /MOLLIE_SELF_SERVE_PLAN_KEYS = \["professional", "business"\]/);
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /Enterprise is manual-only/);
});

test("D: normal Plans/Billing checkout branches on org provider", () => {
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /orgProvider === "mollie"/);
  assert.match(actions, /mollieCheckout/);
  assert.match(actions, /createFastSpringCheckoutPayloadForPlan/);
  const grid = readSource("src/components/pricing/pricing-grid.tsx");
  assert.match(grid, /mollieCheckout/);
  assert.match(grid, /window\.location\.assign/);
});

// E — Webhooks
test("E: classic webhook dual-path by billing surface; no Next-Gen webhooks", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /MOLLIE_METADATA_BILLING_SURFACE/);
  assert.match(webhooks, /reconcileMollieProductionPaymentWebhook/);
  assert.match(webhooks, /reconcileMollieTestPaymentWebhook/);
  assert.match(webhooks, /upsertMollieOrganizationSubscription/);
  assert.match(webhooks, /upsertMollieTestSubscription/);
  assert.doesNotMatch(webhooks, /next-gen|NextGen|dashboard webhook/i);
  const route = readSource("src/app/api/mollie/webhook/route.ts");
  assert.match(route, /export async function POST/);
});

test("E: FastSpring sync refuses Mollie overwrite", () => {
  const sync = readSource("src/lib/fastspring/sync.ts");
  assert.match(sync, /billing_provider === "mollie"/);
  assert.match(sync, /mollie_subscription_present_refusing_fastspring_overwrite/);
});

// F — Return page informational only
test("F: production return page does not grant entitlements", () => {
  assert.ok(pathExists("src/app/(dashboard)/settings/billing/mollie/return/page.tsx"));
  const page = readSource("src/app/(dashboard)/settings/billing/mollie/return/page.tsx");
  assert.match(page, /not trusted|Informational return page/i);
  assert.match(page, /webhook/i);
  assert.doesNotMatch(page, /resolveOrganizationEntitlements/);
  assert.doesNotMatch(page, /upsertMollieOrganizationSubscription/);
});

// G — Plan change / cancel
test("G: Mollie plan change updates amount from canonical catalog — no invented proration", () => {
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /changeMollieOrganizationPlan/);
  assert.match(lifecycle, /customerSubscriptions\.update/);
  assert.match(lifecycle, /getPlanByKey/);
  assert.match(lifecycle, /no invented proration/i);
  assert.match(lifecycle, /Enterprise plan changes are manual-only/);
});

test("G: Mollie cancel is immediate via API — no fake period-end theatre", () => {
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /cancelMollieOrganizationSubscription/);
  assert.match(lifecycle, /customerSubscriptions\.cancel/);
  assert.match(lifecycle, /canceledAtPeriodEnd: false/);
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /cancelMollieSubscriptionAction/);
});

// H — Payment failure / suspension
test("H: payment failure and suspended map to non-usable statuses", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /payment_failed/);
  assert.match(webhooks, /past_due|inactive/);
  const checkout = readSource("src/lib/billing/providers/mollie/checkout.ts");
  assert.match(checkout, /isMolliePaymentTerminalFailure/);
});

// I — Coexistence / ID mixing
test("I: Mollie org sync refuses FastSpring/legacy overwrite", () => {
  const orgSync = readSource("src/lib/billing/providers/mollie/organization-sync.ts");
  assert.match(orgSync, /isFastSpringBackedSubscription/);
  assert.match(orgSync, /Refusing Mollie write/);
  assert.match(orgSync, /legacy provider/);
});

test("I: Mollie customer IDs must be cst_; subscriptions sub_", () => {
  const orgSync = readSource("src/lib/billing/providers/mollie/organization-sync.ts");
  assert.match(orgSync, /startsWith\("cst_"\)/);
  assert.match(orgSync, /startsWith\("sub_"\)/);
  const active = readSource("src/lib/billing/active-billing.ts");
  assert.match(active, /hasVerifiedMollieSubscription/);
  assert.match(active, /hasVerifiedMollieCustomer/);
});

// J — TEST/LIVE separation
test("J: LIVE charging requires explicit flag; TEST path still assertMollieTestModeOnly", () => {
  const mode = readSource("src/lib/billing/providers/mollie/mode.ts");
  assert.match(mode, /assertMolliePaymentOpsAllowed/);
  assert.match(mode, /MOLLIE_LIVE_CHARGING_ENABLED/);
  assert.match(mode, /assertMollieTestModeOnly/);
  for (const file of [
    "src/lib/billing/providers/mollie/customer.ts",
    "src/lib/billing/providers/mollie/checkout.ts",
  ]) {
    assert.match(readSource(file), /assertMollieTestModeOnly/, `${file} TEST gate`);
  }
  const prod = readSource("src/lib/billing/providers/mollie/production-checkout.ts");
  assert.match(prod, /assertMolliePaymentOpsAllowed/);
});

// K — Phase 2 test table remains non-SoT for production
test("K: mollie_test_subscriptions remains Phase 2 TEST parallel state", () => {
  const sync = readSource("src/lib/billing/providers/mollie/sync.ts");
  assert.match(sync, /mollie_test_subscriptions/);
  const foundation = readSource("src/lib/billing/providers/mollie/foundation.ts");
  assert.match(foundation, /phase_3_production_integration/);
  assert.match(foundation, /NEVER the/);
  assert.match(foundation, /production source of truth/i);
});

// L — Idempotency
test("L: webhook idempotency ledger + checkout idempotency keys", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /ensureMollieIdempotency/);
  assert.match(webhooks, /23505/);
  const prod = readSource("src/lib/billing/providers/mollie/production-checkout.ts");
  assert.match(prod, /idempotencyKey/);
  assert.match(prod, /mollie:prod:/);
});

// M — Security
test("M: no NEXT_PUBLIC Mollie secrets; API keys server-only", () => {
  const envExample = readSource(".env.example");
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_MOLLIE/);
  const client = readSource("src/lib/billing/providers/mollie/client.ts");
  assert.match(client, /import "server-only"/);
  const env = readSource("src/lib/billing/providers/mollie/env.ts");
  assert.match(env, /import "server-only"/);
});

// N — Enterprise / communication untouched
test("N: enterprise contact / FastSpring webhook routes preserved", () => {
  assert.ok(pathExists("src/app/api/fastspring/webhook/route.ts"));
  assert.ok(pathExists("src/lib/billing/enterprise-contact.ts") || pathExists("src/components/settings/enterprise-request-card.tsx"));
});

// O — UI no redesign; Mollie label only
test("O: billing panel shows Mollie provider label without redesign", () => {
  const panel = readSource("src/components/settings/billing-settings-panel.tsx");
  assert.match(panel, /billing_provider === "mollie"/);
  assert.match(panel, /"Mollie"/);
});

// P — UI status Mollie-capable when org provider resolves to mollie (ownership survives rollout rollback)
test("P: billing UI status Mollie when org provider is mollie", () => {
  const ui = readSource("src/lib/billing/ui-status.ts");
  assert.match(ui, /orgProvider === "mollie"/);
  assert.match(ui, /isMollieProductionCheckoutConfigured/);
  assert.match(ui, /enterprise: false/);
  assert.match(ui, /ownership or new-checkout eligibility|Mollie-owned/i);
});

// Q — Diagnostics sanitized
test("Q: diagnostics prefixes only — no full secrets", () => {
  const checkout = readSource("src/lib/billing/providers/mollie/checkout.ts");
  assert.match(checkout, /customerIdPrefix/);
  assert.doesNotMatch(checkout, /console\.(log|info|debug).*MOLLIE_API_KEY/);
});

// R — Downgrade guard allows Mollie plan change without portal
test("R: checkout guard allows Mollie downgrade path; FastSpring still portal-gated", () => {
  const guards = readSource("src/lib/billing/checkout-guards.ts");
  assert.match(guards, /activeProvider === "mollie"/);
  assert.match(guards, /billing portal to downgrade/);
});
