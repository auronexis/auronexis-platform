/**
 * Organization settings persistence — source contracts for regional columns + save action.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pathExists, readSource } from "./_test-helpers/read-source.mjs";

describe("organization settings persistence", () => {
  it("regional columns migration exists and is additive", () => {
    assert.equal(
      pathExists("supabase/migrations/20250720120000_ensure_organization_regional_columns.sql"),
      true,
    );
    const sql = readSource(
      "supabase/migrations/20250720120000_ensure_organization_regional_columns.sql",
    );
    assert.match(sql, /ADD COLUMN IF NOT EXISTS timezone/);
    assert.match(sql, /ADD COLUMN IF NOT EXISTS date_format/);
    assert.match(sql, /ADD COLUMN IF NOT EXISTS time_format/);
    assert.match(sql, /ADD COLUMN IF NOT EXISTS week_start/);
    assert.match(sql, /ADD COLUMN IF NOT EXISTS measurement_system/);
    assert.doesNotMatch(sql, /DROP TABLE/i);
    assert.doesNotMatch(sql, /TRUNCATE/i);
  });

  it("updateOrganizationAction persists all regional fields", () => {
    const actions = readSource("src/lib/team/actions.ts");
    assert.match(actions, /export async function updateOrganizationAction/);
    assert.match(actions, /timezone:\s*parsed\.data\.timezone/);
    assert.match(actions, /date_format:\s*parsed\.data\.dateFormat/);
    assert.match(actions, /time_format:\s*parsed\.data\.timeFormat/);
    assert.match(actions, /week_start:\s*parsed\.data\.weekStart/);
    assert.match(actions, /measurement_system:\s*parsed\.data\.measurementSystem/);
    assert.match(actions, /saved\?\.date_format/);
    assert.match(actions, /saved\?\.time_format/);
    assert.match(actions, /saved\?\.week_start/);
    assert.match(actions, /saved\?\.measurement_system/);
  });

  it("organization form submits regional field names expected by the action", () => {
    const form = readSource("src/components/settings/organization-form.tsx");
    assert.match(form, /name="timezone"/);
    assert.match(form, /name="dateFormat"/);
    assert.match(form, /name="timeFormat"/);
    assert.match(form, /name="weekStart"/);
    assert.match(form, /name="measurementSystem"/);
    assert.match(form, /updateOrganizationAction/);
  });

  it("database types include regional organization columns", () => {
    const types = readSource("src/types/database.ts");
    assert.match(types, /timezone:\s*string/);
    assert.match(types, /date_format:\s*string/);
    assert.match(types, /time_format:\s*string/);
    assert.match(types, /week_start:\s*string/);
    assert.match(types, /measurement_system:\s*string/);
  });
});
