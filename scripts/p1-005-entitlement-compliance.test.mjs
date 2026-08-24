/**
 * P1-005 — production entitlement / plan hierarchy / diagnostics / compliance remediation.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource, pathExists } from "./_test-helpers/read-source.mjs";

test("canonical plan hierarchy ranks Starter < Professional < Business < Enterprise", () => {
  const hierarchy = readSource("src/lib/plans/hierarchy.ts");
  assert.match(hierarchy, /starter:\s*1/);
  assert.match(hierarchy, /professional:\s*2/);
  assert.match(hierarchy, /business:\s*3/);
  assert.match(hierarchy, /enterprise:\s*4/);
  assert.match(hierarchy, /planRankAtLeast/);
  assert.match(hierarchy, /planMeetsMinimum/);
});

test("effective plan resolver is Mollie-aware and ignores organizations.plan", () => {
  const effective = readSource("src/lib/plans/effective-plan.ts");
  assert.match(effective, /resolveEffectivePlanFromSubscriptionRows/);
  assert.match(effective, /getOrganizationBillingProvider/);
  assert.match(effective, /selectPreferredSubscriptionSummaryRow/);
  assert.match(effective, /organizations\.plan is never used/);
  assert.match(effective, /Fail closed/);

  const queries = readSource("src/lib/plans/queries.ts");
  assert.match(queries, /resolveEffectivePlanFromSubscriptionRows/);
  assert.doesNotMatch(queries, /selectPreferredSubscriptionSummaryRow\(\s*\(data/);
});

test("subscription selection defaults to Mollie not FastSpring", () => {
  const sel = readSource("src/lib/billing/subscription-selection.ts");
  assert.match(sel, /BillingProvider = "mollie"/);
  assert.doesNotMatch(sel, /BillingProvider = "fastspring"/);
});

test("Mollie provider_price_id maps professional, business, and enterprise", () => {
  const plansServer = readSource("src/lib/billing/plans.server.ts");
  assert.match(
    plansServer,
    /priceId === "professional" \|\| priceId === "business" \|\| priceId === "enterprise"/,
  );
});

test("EUR catalog remains Professional 179 / Business 599 / Enterprise 1799", () => {
  const catalog = readSource("src/lib/billing/price-catalog.ts");
  assert.match(catalog, /amountMinor:\s*17_900/);
  assert.match(catalog, /amountMinor:\s*59_900/);
  assert.match(catalog, /amountMinor:\s*179_900/);
  assert.match(catalog, /PRIMARY_BILLING_CURRENCY.*=.*"EUR"/);
});

test("feature matrix: Business unlocks Professional features; Enterprise-only stays locked", () => {
  const features = readSource("src/lib/plans/features.ts");
  // Business block contains risks/incidents true and future_api_webhooks false
  const businessIdx = features.indexOf("business: {");
  const enterpriseIdx = features.indexOf("enterprise: {");
  assert.ok(businessIdx > 0 && enterpriseIdx > businessIdx);
  const businessBlock = features.slice(businessIdx, enterpriseIdx);
  assert.match(businessBlock, /risks:\s*true/);
  assert.match(businessBlock, /incidents:\s*true/);
  assert.match(businessBlock, /white_label:\s*true/);
  assert.match(businessBlock, /report_templates:\s*true/);
  assert.match(businessBlock, /future_api_webhooks:\s*false/);
  assert.match(businessBlock, /priority_support:\s*false/);
  assert.match(features, /future_api_webhooks:\s*"enterprise"/);
  assert.match(features, /priority_support:\s*"enterprise"/);
});

test("diagnostics plan source labels are Mollie-only (no active Stripe/Paddle copy)", () => {
  const labels = readSource("src/lib/plans/plan-source-labels.ts");
  assert.match(labels, /Active Mollie subscription/);
  assert.doesNotMatch(labels, /Active Stripe subscription/);
  assert.doesNotMatch(labels, /unmapped Stripe price ID/);
});

test("production readiness does not score Stripe webhook archive as a core blocker", () => {
  const readiness = readSource("src/lib/diagnostics/production-readiness.ts");
  assert.doesNotMatch(readiness, /stripeWebhook\.failedEvents/);
  assert.match(readiness, /stripeReadiness = billingReadiness/);
});

test("INTEGRATION_SECRET_KEY is optional for pilot readiness scoring", () => {
  const goLive = readSource("src/lib/diagnostics/go-live-readiness.ts");
  assert.match(goLive, /INTEGRATION_SECRET_KEY optional for pilot/);
  const security = readSource("src/lib/diagnostics/security-readiness.ts");
  assert.match(security, /INTEGRATION_SECRET_KEY optional for pilot/);
  assert.doesNotMatch(security, /integrationSecretConfigured && cronSecretConfigured/);
  const vercel = readSource("src/lib/diagnostics/vercel-production-readiness.ts");
  assert.doesNotMatch(
    vercel,
    /OAUTH_ENV_KEYS = \["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "INTEGRATION_SECRET_KEY"\]/,
  );
});

test("billing diagnostics use Mollie config health not Paddle", () => {
  const diag = readSource("src/lib/billing/diagnostics.ts");
  assert.match(diag, /checkMollieApiConfigHealth/);
  assert.doesNotMatch(diag, /checkPaddleHealth/);
});

test("compliance workspace fails soft instead of throwing raw 500", () => {
  const repo = readSource("src/lib/compliance/repository.ts");
  assert.match(repo, /workspace load failed/);
  assert.match(repo, /ensureDefaultPolicies\(session\.organization\.id\)\.catch/);
  assert.match(repo, /Compliance data could not be loaded/);
});

test("LIVE Mollie charging remains fail-closed", () => {
  // Prefer known gate files
  const candidates = [
    "src/lib/billing/providers/mollie/env.ts",
    "src/lib/billing/providers/mollie/rollout.ts",
    "src/lib/billing/providers/mollie/production-checkout.ts",
  ];
  const joined = candidates.map((p) => (pathExists(p) ? readSource(p) : "")).join("\n");
  assert.match(joined, /MOLLIE_LIVE_CHARGING_ENABLED/);
});

test("no active FastSpring checkout restoration in provider", () => {
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /return "mollie"/);
  assert.match(provider, /isFastSpringActiveBillingProvider[\s\S]*return false/);
});
