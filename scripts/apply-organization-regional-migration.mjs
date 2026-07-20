#!/usr/bin/env node
/**
 * Apply organization regional columns migration to a Postgres database.
 *
 * Usage (never commit passwords):
 *   DATABASE_URL="postgresql://..." node scripts/apply-organization-regional-migration.mjs
 *
 * Or:
 *   SUPABASE_DB_PASSWORD="..." SUPABASE_PROJECT_REF="norrzshzshmvbrmpmhjb" node scripts/apply-organization-regional-migration.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sqlPath = join(
  root,
  "supabase/migrations/20250720120000_ensure_organization_regional_columns.sql",
);

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim();
  }
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const ref = process.env.SUPABASE_PROJECT_REF?.trim() || "norrzshzshmvbrmpmhjb";
  if (!password) {
    return null;
  }
  const encoded = encodeURIComponent(password);
  return `postgresql://postgres.${ref}:${encoded}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;
}

const databaseUrl = resolveDatabaseUrl();
if (!databaseUrl) {
  console.error(
    "Missing DATABASE_URL or SUPABASE_DB_PASSWORD. Apply supabase/migrations/20250720120000_ensure_organization_regional_columns.sql in the Supabase SQL Editor.",
  );
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");
const result = spawnSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-c", sql], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

if (result.status !== 0) {
  console.error(result.stderr || result.stdout || "psql failed");
  process.exit(result.status ?? 1);
}

console.log("Applied organization regional columns migration.");
console.log((result.stdout || "").trim());
