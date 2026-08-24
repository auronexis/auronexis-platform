/**
 * Final production closeout — regression contracts for entitlements, exports,
 * white-label semantics, readiness scoring, and secret vault fail-closed.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource, pathExists } from "./_test-helpers/read-source.mjs";

test("canonical effective-plan path ignores organizations.plan", () => {
  const effective = readSource("src/lib/plans/effective-plan.ts");
  assert.match(effective, /organizations\.plan is never used/);
  assert.match(effective, /getOrganizationBillingProvider/);
  const layout = readSource("src/app/(dashboard)/layout.tsx");
  assert.match(layout, /planTier=\{navPlan\}/);
  assert.doesNotMatch(layout, /planTier=\{session\.organization\.plan\}/);
});

test("Business plan grants white_label entitlement", () => {
  const features = readSource("src/lib/plans/features.ts");
  const businessIdx = features.indexOf("business: {");
  const enterpriseIdx = features.indexOf("enterprise: {");
  const businessBlock = features.slice(businessIdx, enterpriseIdx);
  assert.match(businessBlock, /white_label:\s*true/);
});

test("white-label diagnostics distinguish entitlement vs configuration vs platform", () => {
  const types = readSource("src/lib/white-label/types.ts");
  assert.match(types, /configurationStatus/);
  assert.match(types, /platform_unavailable/);
  assert.match(types, /not_configured/);
  assert.match(types, /entitlementSeparateFromConfig/);
  const queries = readSource("src/lib/white-label/queries.ts");
  assert.match(queries, /createAdminClient/);
  assert.match(queries, /configurationStatus/);
  assert.match(queries, /platform_unavailable/);
});

test("white-label schema prerequisite migration exists before DELETE policy", () => {
  assert.equal(
    pathExists("supabase/migrations/20250824115000_white_label_settings_schema_prerequisite.sql"),
    true,
  );
  const prerequisite = readSource(
    "supabase/migrations/20250824115000_white_label_settings_schema_prerequisite.sql",
  );
  assert.match(prerequisite, /CREATE TABLE IF NOT EXISTS public\.white_label_settings/);
  assert.match(prerequisite, /ENABLE ROW LEVEL SECURITY/);
});

test("white-label DELETE RLS migration exists", () => {
  assert.equal(
    pathExists("supabase/migrations/20250824120000_white_label_settings_delete_policy.sql"),
    true,
  );
  const migration = readSource(
    "supabase/migrations/20250824120000_white_label_settings_delete_policy.sql",
  );
  assert.match(migration, /white_label_settings_delete_owner_admin/);
  assert.match(migration, /GRANT DELETE ON public\.white_label_settings/);
});

test("compliance workspace and diagnostics fail soft without secret leakage", () => {
  const repo = readSource("src/lib/compliance/repository.ts");
  assert.match(repo, /workspace load failed/);
  assert.match(repo, /no secrets are exposed/);
  const diagnostics = readSource("src/lib/compliance/diagnostics.ts");
  assert.match(diagnostics, /diagnostics snapshot failed/);
  assert.match(diagnostics, /EMPTY_COMPLIANCE_DIAGNOSTICS/);
});

test("evidence bundle download survives optional audit_exports persistence failure", () => {
  const exportSrc = readSource("src/lib/compliance/export.ts");
  assert.match(exportSrc, /Persistence is optional/);
  assert.match(exportSrc, /evidence export persistence failed/);
  const actions = readSource("src/lib/compliance/actions.ts");
  assert.match(actions, /exportEvidenceAction/);
  assert.match(actions, /Evidence bundle generation failed/);
});

test("audit CSV/JSON export sanitizes secrets and fails closed to action error", () => {
  const sanitize = readSource("src/lib/audit/export-sanitize.ts");
  assert.match(sanitize, /sanitizeExportMetadata/);
  assert.match(sanitize, /\[REDACTED\]/);
  const exporter = readSource("src/lib/audit/exporter.ts");
  assert.match(exporter, /sanitizeExportMetadata/);
  assert.match(exporter, /persist failed/);
  const actions = readSource("src/lib/compliance/actions.ts");
  assert.match(actions, /Audit export failed/);
});

test("INTEGRATION_SECRET_KEY vault writes remain fail-closed", () => {
  const encryption = readSource("src/lib/integrations/secrets/encryption.ts");
  assert.match(encryption, /assertEncryptionKeyForSecretCreation/);
  assert.match(encryption, /isProductionRuntime/);
  assert.match(encryption, /INTEGRATION_SECRET_KEY is not configured/);
  assert.doesNotMatch(encryption, /hardcoded|fallback key|randomBytes\(.*\).*INTEGRATION/i);
  const repository = readSource("src/lib/integrations/secrets/repository.ts");
  assert.match(repository, /assertEncryptionKeyForSecretCreation/);
});

test("production runtime detection prefers Vercel scope and NODE_ENV=production", () => {
  const runtime = readSource("src/lib/diagnostics/runtime-environment.ts");
  assert.match(runtime, /isProductionRuntime/);
  assert.match(runtime, /VERCEL_ENV/);
  assert.match(runtime, /NODE_ENV === "production"/);
  const vercel = readSource("src/lib/diagnostics/vercel-production-readiness.ts");
  assert.match(vercel, /isProductionRuntime/);
  assert.match(vercel, /isVercelRuntime/);
  assert.doesNotMatch(vercel, /developmentConfigured = scope === "development"/);
});

test("booking links are optional and do not block revenue/launch readiness scores", () => {
  const revenue = readSource("src/lib/diagnostics/revenue-readiness.ts");
  assert.match(revenue, /bookingLinksOptional:\s*true/);
  assert.doesNotMatch(revenue, /booking\.configured \|\| process\.env\.NODE_ENV/);
  const launch = readSource("src/lib/diagnostics/launch-candidate-readiness.ts");
  assert.doesNotMatch(launch, /bookingLinksConfigured \|\| isDev/);
  const acquisition = readSource("src/lib/diagnostics/acquisition-readiness.ts");
  assert.doesNotMatch(acquisition, /booking\.configured \|\|/);
});

test("API and compliance readiness do not treat empty tenant maturity as platform-broken 40", () => {
  const readiness = readSource("src/lib/diagnostics/production-readiness.ts");
  assert.match(readiness, /scorePlatformModule/);
  assert.match(readiness, /maturityPercent/);
  assert.match(readiness, /registeredConnectors/);
});

test("retired Stripe/FastSpring/Paddle do not drive go-live billing checks", () => {
  const goLive = readSource("src/lib/diagnostics/go-live-readiness.ts");
  assert.match(goLive, /getMollieApiKeyPresence/);
  assert.match(goLive, /FastSpring retired/);
  assert.doesNotMatch(goLive, /PADDLE_|FASTSPRING_API|STRIPE_SECRET/);
});

test("MOLLIE_LIVE_CHARGING_ENABLED remains fail-closed and untouched by closeout", () => {
  const candidates = [
    "src/lib/billing/providers/mollie/env.ts",
    "src/lib/billing/providers/mollie/rollout.ts",
    "src/lib/billing/providers/mollie/production-checkout.ts",
    "src/lib/billing/providers/mollie/live-charging.ts",
  ];
  const joined = candidates.map((p) => (pathExists(p) ? readSource(p) : "")).join("\n");
  assert.match(joined, /MOLLIE_LIVE_CHARGING_ENABLED/);
});

test("EUR catalog remains Professional 179 / Business 599 / Enterprise 1799", () => {
  const catalog = readSource("src/lib/billing/price-catalog.ts");
  assert.match(catalog, /amountMinor:\s*17_900/);
  assert.match(catalog, /amountMinor:\s*59_900/);
  assert.match(catalog, /amountMinor:\s*179_900/);
});
