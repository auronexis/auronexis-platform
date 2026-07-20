import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { readSource, rootDir } from "./_test-helpers/read-source.mjs";

test("Build Bible V2 Chapter 5 database doc and rule exist", () => {
  assert.ok(existsSync(join(rootDir, "docs/07_BUILD_BIBLE_V2_CHAPTER_05_DATABASE.md")));
  const doc = readSource("docs/07_BUILD_BIBLE_V2_CHAPTER_05_DATABASE.md");
  assert.match(doc, /Status:\*\* Implemented/);
  const rule = readSource(".cursor/rules/build-bible-v2-ch5-database.mdc");
  assert.match(rule, /alwaysApply:\s*true/);
  assert.match(rule, /Never weaken RLS/);
});

test("typed Supabase helpers and TablesInsert aliases exist", () => {
  const typed = readSource("src/lib/supabase/typed.ts");
  const database = readSource("src/types/database.ts");
  assert.match(typed, /export function insertRows/);
  assert.match(typed, /export function updateRows/);
  assert.match(database, /export type TablesInsert/);
  assert.match(database, /export type TablesUpdate/);
});

test("health snapshot select and mapper are centralized", () => {
  const healthTypes = readSource("src/lib/health/types.ts");
  const intelligence = readSource("src/lib/intelligence/queries.ts");
  const portalHealth = readSource("src/lib/client-portal/portal-health.ts");
  const publicApi = readSource("src/lib/public-api/resources.ts");
  assert.match(healthTypes, /export const HEALTH_SNAPSHOT_SELECT/);
  assert.match(healthTypes, /export function mapHealthSnapshotRow/);
  assert.match(intelligence, /HEALTH_SNAPSHOT_SELECT/);
  assert.doesNotMatch(intelligence, /const HEALTH_SNAPSHOT_SELECT\s*=/);
  assert.match(portalHealth, /mapHealthSnapshotRow/);
  assert.match(publicApi, /HEALTH_SNAPSHOT_SELECT/);
});

test("subscription and SLA selects are not triplicated", () => {
  const billing = readSource("src/lib/billing/queries.ts");
  const entitlements = readSource("src/lib/entitlements/resolver.ts");
  const maintenance = readSource("src/lib/billing/maintenance.ts");
  const slaTypes = readSource("src/lib/sla/types.ts");
  const escalationTypes = readSource("src/lib/escalation/types.ts");
  assert.match(billing, /export const ORGANIZATION_SUBSCRIPTION_SELECT/);
  assert.match(entitlements, /ORGANIZATION_SUBSCRIPTION_SELECT/);
  assert.match(maintenance, /ORGANIZATION_SUBSCRIPTION_SELECT/);
  assert.doesNotMatch(entitlements, /const SUBSCRIPTION_SELECT\s*=/);
  assert.match(slaTypes, /export const SLA_POLICY_SELECT/);
  assert.match(slaTypes, /export const SLA_EVENT_SELECT/);
  assert.match(escalationTypes, /export const ESCALATION_RULE_SELECT/);
});

test("presentation pages do not import Supabase clients", () => {
  const resetPage = readSource("src/app/(auth)/reset-password/page.tsx");
  assert.doesNotMatch(resetPage, /@\/lib\/supabase/);
  assert.match(resetPage, /resolveResetPasswordSession/);
  assert.ok(existsSync(join(rootDir, "src/lib/auth/reset-session.ts")));
});

test("no Supabase imports under src/components", () => {
  const componentsDir = join(rootDir, "src/components");
  const offenders = [];

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(entry.name)) {
        continue;
      }
      const source = readFileSync(full, "utf8");
      if (/@\/lib\/supabase|createClient|createAdminClient/.test(source)) {
        offenders.push(full.replace(rootDir + "\\", "").replace(rootDir + "/", ""));
      }
    }
  }

  walk(componentsDir);
  assert.deepEqual(offenders, []);
});

test("chapter 5 index migration is additive and idempotent", () => {
  const migration = readSource(
    "supabase/migrations/20250719120000_organization_id_index_coverage.sql",
  );
  assert.match(migration, /CREATE INDEX IF NOT EXISTS idx_job_executions_organization_id/);
  assert.match(migration, /CREATE INDEX IF NOT EXISTS idx_queue_jobs_organization_id/);
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN/i);
});

test("activation and adoption prefs use typed insert/update helpers", () => {
  const activation = readSource("src/lib/activation/preferences-db.ts");
  const adoption = readSource("src/lib/adoption/preferences-db.ts");
  assert.match(activation, /insertRows|updateRows/);
  assert.match(adoption, /insertRows|updateRows/);
  assert.doesNotMatch(activation, /as never/);
  assert.doesNotMatch(adoption, /as never/);
});
