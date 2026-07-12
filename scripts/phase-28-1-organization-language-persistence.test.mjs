import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

test("organization settings page reads stored language without browser fallback", () => {
  const page = readSource("src/app/(dashboard)/settings/organization/page.tsx");
  const resolve = readSource("src/lib/i18n/resolve-locale.ts");
  assert.match(page, /getStoredOrganizationLanguage/);
  assert.doesNotMatch(page, /resolveLocaleFromOrganization/);
  assert.match(resolve, /getStoredOrganizationLanguage/);
  assert.match(resolve, /Never applies browser/);
});

test("save action persists language with post-update verification", () => {
  const actions = readSource("src/lib/team/actions.ts");
  assert.match(actions, /language: parsed\.data\.language/);
  assert.match(actions, /\.select\("id, name, language"\)/);
  assert.match(actions, /savedLanguage !== parsed\.data\.language/);
  assert.match(actions, /createAdminClient/);
});

test("session load explicitly selects organization language", () => {
  const session = readSource("src/lib/auth/session.ts");
  assert.match(session, /\.select\("id, name, slug, plan, language, created_at, updated_at"\)/);
});

test("organization form refreshes server state after successful save", () => {
  const form = readSource("src/components/settings/organization-form.tsx");
  assert.match(form, /router\.refresh/);
  assert.match(form, /key=\{`\$\{organizationName\}-\$\{organizationLanguage\}`\}/);
});

test("billing invoices use organization language as source of truth", () => {
  const invoices = readSource("src/lib/billing/invoices.ts");
  assert.match(invoices, /resolveLocaleFromOrganization\(session\.organization\)/);
});

test("canonical database field is organizations.language", () => {
  const migration = readSource("supabase/migrations/20250707000000_organization_language.sql");
  const types = readSource("src/types/database.ts");
  assert.match(migration, /organizations/);
  assert.match(migration, /language TEXT/);
  assert.doesNotMatch(migration, /billing_language/);
  assert.doesNotMatch(migration, /default_language/);
  assert.match(types, /language: string;/);
});
