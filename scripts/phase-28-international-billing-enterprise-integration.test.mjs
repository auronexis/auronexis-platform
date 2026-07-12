import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

test("organization language migration exists with de/en constraint", () => {
  const migration = readSource("supabase/migrations/20250707000000_organization_language.sql");
  assert.match(migration, /language TEXT NOT NULL DEFAULT 'de'/);
  assert.match(migration, /CHECK \(language IN \('de', 'en'\)\)/);
});

test("i18n module centralizes invoice translations for German and English", () => {
  const invoice = readSource("src/lib/i18n/invoice.ts");
  assert.match(invoice, /de:\s*\{/);
  assert.match(invoice, /en:\s*\{/);
  assert.match(invoice, /title: "Rechnung"/);
  assert.match(invoice, /title: "Invoice"/);
  assert.match(invoice, /latestInvoices/);
  assert.match(invoice, /thankYou/);
});

test("locale resolution prioritizes organization language with English fallback", () => {
  const resolve = readSource("src/lib/i18n/resolve-locale.ts");
  assert.match(resolve, /organizationLanguage/);
  assert.match(resolve, /customerLanguage/);
  assert.match(resolve, /browserLanguage/);
  assert.match(resolve, /return "en"/);
});

test("invoice center panel uses centralized translations", () => {
  const panel = readSource("src/components/settings/invoice-center-panel.tsx");
  assert.match(panel, /getInvoiceTranslations/);
  assert.match(panel, /getLocalizedInvoiceDisplayLabel/);
  assert.match(panel, /formatLocalizedInvoiceDueLabel/);
  assert.doesNotMatch(panel, /Latest invoices/);
  assert.doesNotMatch(panel, /Download invoice PDF/);
});

test("organization form exposes language selector", () => {
  const form = readSource("src/components/settings/organization-form.tsx");
  const actions = readSource("src/lib/team/actions.ts");
  assert.match(form, /name="language"/);
  assert.match(form, /German/);
  assert.match(form, /English/);
  assert.match(actions, /language: z\.enum\(\["de", "en"\]/);
});

test("integration center uses real snapshot queries without placeholder values", () => {
  const snapshot = readSource("src/lib/integrations/center/snapshot.ts");
  const workspace = readSource("src/components/settings/integration-center-workspace.tsx");
  assert.match(snapshot, /getIntegrationCenterSnapshot/);
  assert.match(snapshot, /ai_usage_events/);
  assert.match(snapshot, /openaiApiKey/);
  assert.match(workspace, /No data available/);
  assert.doesNotMatch(workspace, /placeholder/i);
  assert.doesNotMatch(workspace, /fake/i);
});

test("OpenAI test connection uses provider health check", () => {
  const actions = readSource("src/lib/integrations/center/actions.ts");
  assert.match(actions, /createOpenAIProvider/);
  assert.match(actions, /provider\.health\(\)/);
  assert.match(actions, /OPENAI_API_KEY/);
});

test("settings hub links to integration center", () => {
  const settings = readSource("src/app/(dashboard)/settings/page.tsx");
  assert.match(settings, /\/settings\/integrations/);
  assert.match(settings, /Integration Center/);
});

test("billing invoices map rows with organization locale", () => {
  const invoices = readSource("src/lib/billing/invoices.ts");
  assert.match(invoices, /resolveLocaleFromOrganization/);
  assert.match(invoices, /getInvoiceStatusLabel/);
  assert.match(invoices, /formatMoneyFromCentsLocale/);
});
