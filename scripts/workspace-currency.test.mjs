import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

test("organization currency migration and types exist", () => {
  const migration = readSource("supabase/migrations/20250718170000_organization_currency.sql");
  const types = readSource("src/types/database.ts");
  assert.match(migration, /currency TEXT NOT NULL DEFAULT 'USD'/);
  assert.match(migration, /'USD', 'EUR', 'GBP', 'CAD', 'AUD'/);
  assert.match(types, /currency: string;/);
});

test("central workspace money formatter is the source of truth", () => {
  const format = readSource("src/lib/i18n/format.ts");
  const currency = readSource("src/lib/i18n/currency.ts");
  assert.match(format, /formatWorkspaceMoney/);
  assert.match(currency, /APP_CURRENCIES/);
  assert.match(currency, /DEFAULT_CURRENCY/);
});

test("organization settings persist currency beside language", () => {
  const page = readSource("src/app/(dashboard)/settings/organization/page.tsx");
  const form = readSource("src/components/settings/organization-form.tsx");
  const actions = readSource("src/lib/team/actions.ts");
  assert.match(page, /getStoredOrganizationCurrency/);
  assert.match(form, /name="currency"/);
  assert.match(actions, /currency: parsed\.data\.currency/);
  assert.match(actions, /timezone: parsed\.data\.timezone/);
});

test("dashboard provides workspace money context", () => {
  const layout = readSource("src/app/(dashboard)/layout.tsx");
  const provider = readSource("src/components/workspace/workspace-money-provider.tsx");
  assert.match(layout, /WorkspaceMoneyProvider/);
  assert.match(provider, /useWorkspaceMoney/);
  assert.match(provider, /formatWorkspaceMoney/);
  assert.match(provider, /formatAppDate/);
});

test("sales and profitability surfaces no longer hardcode dollar signs", () => {
  const salesPage = readSource("src/app/(dashboard)/sales/page.tsx");
  const acquisition = readSource("src/app/(dashboard)/sales/acquisition/page.tsx");
  const pipeline = readSource("src/components/sales/pipeline-metric-cards.tsx");
  const profitability = readSource("src/lib/profitability/types.ts");
  const proposals = readSource("src/components/sales/sales-proposal-list.tsx");
  assert.doesNotMatch(salesPage, /`\$\$\{/);
  assert.doesNotMatch(acquisition, /`\$\$\{/);
  assert.doesNotMatch(pipeline, /currency:\s*"USD"/);
  assert.match(profitability, /formatWorkspaceMoney/);
  assert.match(proposals, /formatMoney/);
  assert.doesNotMatch(proposals, />\$/);
});
