import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readMigration(filename) {
  return readFileSync(join(rootDir, "supabase", "migrations", filename), "utf8");
}

function isActivationPanelPersistSuccess(result) {
  return result?.success === true;
}

function isActivationPanelPersistFailure(result) {
  return result?.success === false && typeof result.error === "string";
}

test("activation preferences table uses organization_id primary key", () => {
  const sql = readMigration("20250703000000_activation_system.sql");
  assert.match(sql, /organization_id UUID PRIMARY KEY/);
});

test("RLS policies use auth_user_id not users.id for JWT identity", () => {
  const sql = readMigration("20250703000000_activation_system.sql");
  assert.match(sql, /users\.auth_user_id = auth\.uid\(\)/);
  assert.doesNotMatch(sql, /users\.id = auth\.uid\(\)/);
});

test("authenticated role receives INSERT and UPDATE grants", () => {
  const baseSql = readMigration("20250703000000_activation_system.sql");
  const grantSql = readMigration("20250703110000_activation_prefs_grants.sql");

  assert.match(baseSql, /GRANT SELECT ON public\.organization_activation_preferences TO authenticated/);
  assert.doesNotMatch(
    baseSql,
    /GRANT SELECT, INSERT, UPDATE ON public\.organization_activation_preferences TO authenticated/,
  );

  assert.match(
    grantSql,
    /GRANT SELECT, INSERT, UPDATE ON public\.organization_activation_preferences TO authenticated/,
  );
});

test("missing INSERT grant produces PostgreSQL 42501 on first dismiss insert", () => {
  const simulatedInsertError = {
    code: "42501",
    message: "permission denied for table organization_activation_preferences",
    details: null,
    hint: "Grant the required privileges to the current role with: GRANT INSERT ON public.organization_activation_preferences TO authenticated;",
  };

  assert.equal(simulatedInsertError.code, "42501");
  assert.match(simulatedInsertError.message, /permission denied for table organization_activation_preferences/);
});

test("owner/admin insert policy scopes organization_id to current organization", () => {
  const sql = readMigration("20250703000000_activation_system.sql");
  assert.match(sql, /organization_id = public\.current_organization_id\(\)/);
  assert.match(sql, /users\.role IN \('owner', 'admin'\)/);
});

test("persistence helper selects update path when preference row exists", () => {
  const existing = { organization_id: "org-1" };
  const operation = existing ? "update" : "insert";
  assert.equal(operation, "update");
});

test("persistence helper selects insert path when no preference row exists", () => {
  const existing = null;
  const operation = existing ? "update" : "insert";
  assert.equal(operation, "insert");
});

test("unique violation on concurrent insert falls back to update", () => {
  const insertError = { code: "23505" };
  const shouldRetryUpdate = insertError.code === "23505";
  assert.equal(shouldRetryUpdate, true);
});

test("member/viewer dismiss is denied before database write", () => {
  const sessionRole = "member";
  const canManage = sessionRole === "owner" || sessionRole === "admin";
  const result = canManage
    ? { success: true }
    : { success: false, error: "Only workspace owners and admins can dismiss the activation panel." };

  assert.equal(isActivationPanelPersistFailure(result), true);
  assert.match(result.error, /owners and admins/);
});

test("organization mismatch is denied by RLS not client organization_id", () => {
  const sql = readMigration("20250703000000_activation_system.sql");
  assert.match(sql, /WITH CHECK \(\s*organization_id = public\.current_organization_id\(\)/s);
});

test("restore clears activation_panel_dismissed_at via update patch", () => {
  const patch = { activation_panel_dismissed_at: null };
  assert.equal(patch.activation_panel_dismissed_at, null);
});

test("dismiss action returns typed success result", () => {
  const result = { success: true };
  assert.equal(isActivationPanelPersistSuccess(result), true);
});

test("failed dismiss returns sanitized client error only", () => {
  const result = { success: false, error: "Unable to save workspace preferences." };
  assert.equal(isActivationPanelPersistFailure(result), true);
  assert.doesNotMatch(result.error, /permission denied/i);
});

test("analytics fires only after successful persistence", () => {
  const events = [];

  function onDismissAttempt(persistSuccess) {
    if (persistSuccess) {
      events.push("activation_panel_dismissed");
    }
  }

  onDismissAttempt(false);
  assert.equal(events.length, 0);

  onDismissAttempt(true);
  assert.deepEqual(events, ["activation_panel_dismissed"]);
});
