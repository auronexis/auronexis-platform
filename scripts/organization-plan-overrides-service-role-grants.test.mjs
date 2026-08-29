/**
 * Entitlement plumbing — least-privilege service_role grants on plan overrides.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource, pathExists } from "./_test-helpers/read-source.mjs";

const MIGRATION =
  "supabase/migrations/20250829140000_organization_plan_overrides_service_role_grants.sql";

test("forward migration grants least-privilege service_role privileges on plan overrides", () => {
  assert.equal(pathExists(MIGRATION), true);
  const sql = readSource(MIGRATION);

  assert.match(
    sql,
    /GRANT SELECT,\s*INSERT,\s*UPDATE ON TABLE public\.organization_plan_overrides TO service_role/,
  );
  assert.doesNotMatch(sql, /GRANT ALL ON TABLE public\.organization_plan_overrides TO service_role/);
  assert.doesNotMatch(sql, /GRANT[^;]*DELETE[^;]*organization_plan_overrides/);
});

test("getPlanOverride uses admin client (service_role) org-scoped SELECT", () => {
  const queries = readSource("src/lib/enterprise/queries.ts");
  assert.match(queries, /export async function getPlanOverride/);
  assert.match(queries, /createAdminClient\(\)/);
  assert.match(queries, /\.from\("organization_plan_overrides"\)/);
  assert.match(queries, /\.eq\("organization_id", organizationId\)/);
});

test("platform-admin override upsert is the only app write path (no public self-upgrade)", () => {
  const admin = readSource("src/lib/enterprise/admin-actions.ts");
  assert.match(admin, /assertPlatformAdmin/);
  assert.match(admin, /\.from\("organization_plan_overrides"\)/);
  assert.match(admin, /\.upsert\(/);

  const historical = readSource(
    "supabase/migrations/20250702000000_enterprise_admin_controls_v1.sql",
  );
  assert.match(historical, /GRANT SELECT ON public\.organization_plan_overrides TO authenticated/);
  assert.doesNotMatch(
    historical,
    /GRANT (INSERT|UPDATE|DELETE|ALL) ON public\.organization_plan_overrides TO authenticated/,
  );
  assert.match(
    historical,
    /organization_plan_overrides_select_owner_admin[\s\S]*FOR SELECT TO authenticated/,
  );
  assert.doesNotMatch(
    historical,
    /CREATE POLICY[\s\S]*organization_plan_overrides[\s\S]*FOR (INSERT|UPDATE|DELETE)/,
  );
});

test("entitlement resolver consumes getPlanOverride and fails closed without paid access", () => {
  const resolver = readSource("src/lib/entitlements/resolver.ts");
  assert.match(resolver, /getPlanOverride\(organizationId\)/);
  assert.match(resolver, /planOverride\?\.status === "active"/);
  assert.match(resolver, /MINIMAL_ENTITLEMENTS/);
  assert.match(resolver, /isPaidAccess:\s*false/);
});

test("Professional entitlements include automations (aligned with plan gate + catalog)", () => {
  const definitions = readSource("src/lib/entitlements/definitions.ts");
  const proStart = definitions.indexOf("const PROFESSIONAL_FEATURES");
  const bizStart = definitions.indexOf("const BUSINESS_FEATURES");
  assert.ok(proStart >= 0 && bizStart > proStart);
  const proBlock = definitions.slice(proStart, bizStart);
  assert.match(proBlock, /"automations"/);

  const actions = readSource("src/lib/automation/storage/actions.ts");
  assert.match(actions, /requireFeatureAccess\("automations"/);
  assert.match(actions, /checkPlanFeatureForSession\(session, "ai_automation_builder"\)/);
});
