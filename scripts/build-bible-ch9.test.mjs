import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { readSource, rootDir } from "./_test-helpers/read-source.mjs";

test("Build Bible V2 Chapter 9 i18n doc and rule exist", () => {
  assert.ok(existsSync(join(rootDir, "docs/11_BUILD_BIBLE_V2_CHAPTER_09_I18N.md")));
  const doc = readSource("docs/11_BUILD_BIBLE_V2_CHAPTER_09_I18N.md");
  assert.match(doc, /Status:\*\* Implemented/);
  const rule = readSource(".cursor/rules/build-bible-v2-ch9-i18n.mdc");
  assert.match(rule, /alwaysApply:\s*true/);
  assert.match(rule, /formatWorkspaceMoney/);
});

test("expanded currencies are configured without hardcoded symbols", () => {
  const currency = readSource("src/lib/i18n/currency.ts");
  for (const code of ["CHF", "JPY", "NOK", "SEK", "DKK", "PLN", "CZK", "RON"]) {
    assert.match(currency, new RegExp(`"${code}"`));
  }
  const migration = readSource(
    "supabase/migrations/20250719140000_organization_regional_settings.sql",
  );
  assert.match(migration, /CHF/);
  assert.match(migration, /timezone/);
  assert.match(migration, /date_format/);
  assert.match(migration, /week_start/);
});

test("central number and date formatters exist", () => {
  const number = readSource("src/lib/i18n/number.ts");
  const date = readSource("src/lib/i18n/date.ts");
  assert.match(number, /export function formatAppNumber/);
  assert.match(number, /export function formatAppPercent/);
  assert.match(date, /export function formatAppDate/);
  assert.match(date, /export function formatAppDateTime/);
  assert.match(date, /timeZone/);
  assert.match(date, /formatAppMonthYear/);
});

test("organization form persists regional settings", () => {
  const form = readSource("src/components/settings/organization-form.tsx");
  const actions = readSource("src/lib/team/actions.ts");
  const page = readSource("src/app/(dashboard)/settings/organization/page.tsx");
  assert.match(form, /name="timezone"/);
  assert.match(form, /name="dateFormat"/);
  assert.match(form, /name="weekStart"/);
  assert.match(actions, /date_format: parsed\.data\.dateFormat/);
  assert.match(actions, /measurement_system: parsed\.data\.measurementSystem/);
  assert.match(page, /getStoredOrganizationRegionalSettings/);
});

test("workspace provider exposes money date and number formatters", () => {
  const provider = readSource("src/components/workspace/workspace-money-provider.tsx");
  const layout = readSource("src/app/(dashboard)/layout.tsx");
  assert.match(provider, /formatMoney/);
  assert.match(provider, /formatDate/);
  assert.match(provider, /formatNumber/);
  assert.match(provider, /preferences\.regional\.timezone/);
  assert.match(layout, /dateFormat=\{regional\.dateFormat\}/);
});

test("sales proposal list no longer hardcodes dollar signs", () => {
  const list = readSource("src/components/sales/sales-proposal-list.tsx");
  assert.match(list, /formatMoney/);
  assert.doesNotMatch(list, /\$\{Number/);
  assert.doesNotMatch(list, />\$/);
});

test("message catalog scaffold is present for future language packs", () => {
  const messages = readSource("src/lib/i18n/messages.ts");
  const index = readSource("src/lib/i18n/index.ts");
  assert.match(messages, /COMMON_MESSAGES/);
  assert.match(messages, /export function t/);
  assert.match(index, /COMMON_MESSAGES/);
});

test("report email and proposal PDF use centralized date/money formatters", () => {
  const email = readSource("src/lib/email/report-email-template.ts");
  const pdf = readSource("src/lib/sales/proposal-pdf.ts");
  assert.match(email, /formatAppDate/);
  assert.doesNotMatch(email, /Intl\.DateTimeFormat\("en-US"/);
  assert.match(pdf, /formatAppDate/);
  assert.match(pdf, /formatWorkspaceMoney/);
});
