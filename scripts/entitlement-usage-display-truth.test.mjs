/**
 * Usage display entitlements must match runtime plan feature gates (plans/features.ts).
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

function slicePlanBlock(source, planKey) {
  const marker = `${planKey}: {`;
  const start = source.indexOf(marker);
  assert.ok(start >= 0, `missing ${planKey} block in plans/features.ts`);
  const end = source.indexOf("\n  },", start);
  assert.ok(end > start, `unterminated ${planKey} block`);
  return source.slice(start, end);
}

function sliceEntitlementFeatures(source, constantName) {
  const start = source.indexOf(`const ${constantName}`);
  assert.ok(start >= 0, `missing ${constantName}`);
  const end = source.indexOf("] as const", start);
  assert.ok(end > start, `unterminated ${constantName}`);
  return source.slice(start, end);
}

test("Professional usage display: profitability included, SLA policies excluded", () => {
  const definitions = readSource("src/lib/entitlements/definitions.ts");
  const proBlock = sliceEntitlementFeatures(definitions, "PROFESSIONAL_FEATURES");
  assert.match(proBlock, /"profitability"/);
  assert.doesNotMatch(proBlock, /"sla_policies"/);

  const features = readSource("src/lib/plans/features.ts");
  const proRuntime = slicePlanBlock(features, "professional");
  assert.match(proRuntime, /profitability:\s*true/);
  assert.match(proRuntime, /sla_tracking:\s*false/);
});

test("Business usage display: profitability and SLA policies included", () => {
  const definitions = readSource("src/lib/entitlements/definitions.ts");
  const businessBlock = sliceEntitlementFeatures(definitions, "BUSINESS_FEATURES");
  assert.match(businessBlock, /"profitability"/);
  assert.match(businessBlock, /"sla_policies"/);

  const features = readSource("src/lib/plans/features.ts");
  const businessRuntime = slicePlanBlock(features, "business");
  assert.match(businessRuntime, /profitability:\s*true/);
  assert.match(businessRuntime, /sla_tracking:\s*true/);
});

test("Enterprise usage display: profitability and SLA policies included", () => {
  const definitions = readSource("src/lib/entitlements/definitions.ts");
  const enterpriseBlock = sliceEntitlementFeatures(definitions, "ENTERPRISE_FEATURES");
  assert.match(enterpriseBlock, /"profitability"/);
  assert.match(enterpriseBlock, /"sla_policies"/);

  const features = readSource("src/lib/plans/features.ts");
  const enterpriseRuntime = slicePlanBlock(features, "enterprise");
  assert.match(enterpriseRuntime, /profitability:\s*true/);
  assert.match(enterpriseRuntime, /sla_tracking:\s*true/);
});

test("Usage summary renders entitlement feature labels from definitions", () => {
  const checks = readSource("src/lib/entitlements/checks.ts");
  assert.match(checks, /formatEntitlementFeatureLabels\(entitlements\.features\)/);
  const panel = readSource("src/components/settings/usage-dashboard-panel.tsx");
  assert.match(panel, /entitlements\.featureLabels/);
});
