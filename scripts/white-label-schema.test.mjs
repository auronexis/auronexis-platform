/**
 * White label schema contract — migration ordering, RLS, entitlements, diagnostics semantics.
 */
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { readSource, pathExists, rootDir } from "./_test-helpers/read-source.mjs";

const PREREQUISITE = "20250824115000_white_label_settings_schema_prerequisite.sql";
const DELETE_POLICY = "20250824120000_white_label_settings_delete_policy.sql";
const ORIGINAL = "20250624110000_white_label_platform.sql";

function migrationStamp(name) {
  return name.slice(0, 14);
}

function listMigrations() {
  const migrationsDir = join(rootDir, "supabase", "migrations");
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

test("white_label_settings schema prerequisite migration exists before delete policy", () => {
  const files = listMigrations();
  assert.ok(files.includes(PREREQUISITE), `missing ${PREREQUISITE}`);
  assert.ok(files.includes(DELETE_POLICY), `missing ${DELETE_POLICY}`);
  assert.ok(
    migrationStamp(PREREQUISITE) < migrationStamp(DELETE_POLICY),
    "schema prerequisite must run before delete policy migration",
  );
});

test("schema prerequisite creates white_label_settings with app-used columns", () => {
  const migration = readSource(`supabase/migrations/${PREREQUISITE}`);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.white_label_settings/);
  assert.match(migration, /organization_id UUID NOT NULL UNIQUE/);
  assert.match(migration, /company_name TEXT NOT NULL/);
  assert.match(migration, /logo_light TEXT/);
  assert.match(migration, /logo_dark TEXT/);
  assert.match(migration, /favicon TEXT/);
  assert.match(migration, /login_background TEXT/);
  assert.match(migration, /dashboard_background TEXT/);
  assert.match(migration, /primary_color TEXT NOT NULL/);
  assert.match(migration, /secondary_color TEXT NOT NULL/);
  assert.match(migration, /accent_color TEXT NOT NULL/);
  assert.match(migration, /success_color TEXT NOT NULL/);
  assert.match(migration, /warning_color TEXT NOT NULL/);
  assert.match(migration, /danger_color TEXT NOT NULL/);
  assert.match(migration, /custom_domain TEXT/);
  assert.match(migration, /domain_verification_status TEXT NOT NULL/);
  assert.match(migration, /domain_ssl_status TEXT NOT NULL/);
  assert.match(migration, /email_sender_name TEXT/);
  assert.match(migration, /email_sender_address TEXT/);
  assert.match(migration, /portal_title TEXT/);
  assert.match(migration, /portal_description TEXT/);
  assert.match(migration, /portal_welcome_message TEXT/);
  assert.match(migration, /login_title TEXT/);
  assert.match(migration, /login_subtitle TEXT/);
  assert.match(migration, /login_welcome_message TEXT/);
  assert.match(migration, /pdf_footer TEXT/);
  assert.match(migration, /published_at TIMESTAMPTZ/);
  assert.match(migration, /updated_by UUID REFERENCES public\.users/);
  assert.match(migration, /custom_css TEXT/);
});

test("schema prerequisite enables tenant-isolated RLS for owner/admin writes", () => {
  const migration = readSource(`supabase/migrations/${PREREQUISITE}`);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /white_label_settings_select_own_org/);
  assert.match(migration, /white_label_settings_insert_owner_admin/);
  assert.match(migration, /white_label_settings_update_owner_admin/);
  assert.match(migration, /current_organization_id\(\)/);
  assert.match(migration, /current_user_role\(\) IN \('owner', 'admin'\)/);
  assert.match(migration, /GRANT SELECT, INSERT, UPDATE ON public\.white_label_settings TO authenticated/);
  assert.match(migration, /GRANT ALL ON TABLE public\.white_label_settings TO service_role/);
  assert.doesNotMatch(migration, /GRANT DELETE ON public\.white_label_settings/);
});

test("delete policy migration adds owner/admin DELETE after prerequisite", () => {
  const migration = readSource(`supabase/migrations/${DELETE_POLICY}`);
  assert.match(migration, /white_label_settings_delete_owner_admin/);
  assert.match(migration, /FOR DELETE TO authenticated/);
  assert.match(migration, /current_user_role\(\) IN \('owner', 'admin'\)/);
  assert.match(migration, /GRANT DELETE ON public\.white_label_settings TO authenticated/);
});

test("original white label platform migration retained for historical chain", () => {
  assert.equal(pathExists(`supabase/migrations/${ORIGINAL}`), true);
  const original = readSource(`supabase/migrations/${ORIGINAL}`);
  assert.match(original, /CREATE TABLE IF NOT EXISTS public\.white_label_settings/);
});

test("database types match white_label_settings application contract", () => {
  const types = readSource("src/types/database.ts");
  const actions = readSource("src/lib/white-label/actions.ts");
  assert.match(types, /white_label_settings: \{/);
  assert.match(types, /company_name: string/);
  assert.match(types, /published_at: string \| null/);
  assert.match(actions, /\.from\("white_label_settings"\)/);
  assert.match(actions, /canManageOrganizationSettings/);
  assert.match(actions, /checkPlanFeatureSafe\(session\.organization\.id, "white_label"\)/);
});

test("Business plan grants white_label entitlement", () => {
  const features = readSource("src/lib/plans/features.ts");
  const businessIdx = features.indexOf("business: {");
  const enterpriseIdx = features.indexOf("enterprise: {");
  const businessBlock = features.slice(businessIdx, enterpriseIdx);
  assert.match(businessBlock, /white_label:\s*true/);
});

test("white-label diagnostics distinguish not configured vs infrastructure missing", () => {
  const queries = readSource("src/lib/white-label/queries.ts");
  assert.match(queries, /createAdminClient/);
  assert.match(queries, /tableReachable = !probeError/);
  assert.match(queries, /configurationStatus = "platform_unavailable"/);
  assert.match(queries, /"not_configured"/);
  assert.match(queries, /entitlementSeparateFromConfig: true/);
  const panel = readSource("src/components/settings/diagnostics-panel.tsx");
  assert.match(panel, /whiteLabel\.tableReachable/);
  assert.match(panel, /whiteLabel\.configurationStatus/);
  assert.match(panel, /not_configured/);
});

test("supabase production readiness does not false-fail on unconfigured white label", () => {
  const readiness = readSource("src/lib/diagnostics/supabase-production-readiness.ts");
  assert.match(readiness, /white-label-assets/);
  assert.doesNotMatch(readiness, /white_label_settings/);
  const production = readSource("src/lib/diagnostics/production-readiness.ts");
  assert.match(production, /scorePlatformModule/);
});

test("reset action uses DELETE gated by owner/admin server action", () => {
  const actions = readSource("src/lib/white-label/actions.ts");
  assert.match(actions, /resetWhiteLabelSettingsAction/);
  assert.match(actions, /\.from\("white_label_settings"\)\.delete\(\)/);
  assert.match(actions, /canManageOrganizationSettings/);
});
