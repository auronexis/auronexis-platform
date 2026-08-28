import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { readSource, rootDir } from "./_test-helpers/read-source.mjs";

test("client archive path preserves status update (no hard delete)", () => {
  const actions = readSource("src/lib/clients/actions.ts");
  assert.match(actions, /export async function archiveClientAction/);
  assert.match(actions, /status:\s*"archived"/);
  assert.match(actions, /eventType:\s*"client\.archived"/);
  assert.doesNotMatch(
    actions.slice(actions.indexOf("archiveClientAction"), actions.indexOf("deleteClientAction")),
    /\.delete\(\)/,
  );
});

test("client hard delete is owner/admin + archive-first restricted", () => {
  const actions = readSource("src/lib/clients/actions.ts");
  const guards = readSource("src/lib/clients/guards.ts");
  assert.match(guards, /canHardDeleteClient/);
  assert.match(guards, /role === "owner"/);
  assert.match(guards, /role === "admin"/);
  assert.match(actions, /canHardDeleteClient\(session\.role\)/);
  assert.match(actions, /row\.status !== "archived"/);
  assert.match(actions, /Archive the client before permanent delete/);
});

test("public API DELETE archives only (no hard delete)", () => {
  const route = readSource("src/app/api/v1/clients/[id]/route.ts");
  const resource = readSource("src/lib/api/resources/clients.ts");
  assert.match(route, /apiArchiveClient/);
  assert.doesNotMatch(route, /deleteClientAction|\.delete\(\)/);
  assert.match(resource, /export async function apiArchiveClient/);
  assert.match(resource, /status:\s*"archived"/);
  assert.doesNotMatch(
    resource.slice(resource.indexOf("apiArchiveClient")),
    /\.delete\(\)/,
  );
});

test("UI hard delete only after archive and warns about cascade vs billing", () => {
  const row = readSource("src/components/clients/client-row-actions.tsx");
  const button = readSource("src/components/clients/delete-client-button.tsx");
  assert.match(row, /canHardDelete && isArchived/);
  assert.match(button, /sales invoices/i);
  assert.match(button, /GDPR/i);
  assert.match(button, /cascaded operational/i);
});

test("accounting tables do not FK to clients (migrations)", () => {
  const p1002 = readSource(
    "supabase/migrations/20250824100000_p1_002_pricing_tax_invoice_contracting.sql",
  );
  for (const table of [
    "organization_billing_identities",
    "organization_contract_acceptances",
    "sales_invoices",
  ]) {
    assert.match(p1002, new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}`));
  }
  assert.doesNotMatch(p1002, /REFERENCES public\.clients/);
  assert.doesNotMatch(p1002, /client_id/);

  const migrationsDir = join(rootDir, "supabase", "migrations");
  const mollieFiles = readdirSync(migrationsDir).filter((f) =>
    /mollie/i.test(f),
  );
  assert.ok(mollieFiles.length > 0, "expected mollie migrations");
  for (const file of mollieFiles) {
    const sql = readSource(`supabase/migrations/${file}`);
    assert.doesNotMatch(
      sql,
      /REFERENCES public\.clients/,
      `${file} must not FK to clients`,
    );
  }
});

test("retention docs confirm ARCHIVE_PLUS_RESTRICTED_HARD_DELETE model", () => {
  const doc = readSource("docs/retention.md");
  assert.match(doc, /ARCHIVE_PLUS_RESTRICTED_HARD_DELETE/);
  assert.doesNotMatch(doc, /OPERATOR_DATA_RETENTION_DECISION_REQUIRED/);
  assert.match(doc, /Formal GDPR/i);
  assert.match(doc, /sales invoices/i);
});
