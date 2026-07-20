import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { readSource, rootDir } from "./_test-helpers/read-source.mjs";

test("Build Bible V2 Chapter 2 architecture doc and rule exist", () => {
  assert.ok(existsSync(join(rootDir, "docs/04_BUILD_BIBLE_V2_CHAPTER_02_ARCHITECTURE.md")));
  const rule = readSource(".cursor/rules/build-bible-v2-ch2-architecture.mdc");
  assert.match(rule, /alwaysApply:\s*true/);
  assert.match(rule, /Business logic only in `src\/lib\/\*\*`/);
});

test("canonical date helpers exist and domain wrappers delegate", () => {
  const date = readSource("src/lib/i18n/date.ts");
  const clients = readSource("src/lib/clients/types.ts");
  const risks = readSource("src/lib/risks/types.ts");
  const billing = readSource("src/lib/billing/types.ts");
  assert.match(date, /formatAppDate/);
  assert.match(date, /formatAppDateTime/);
  assert.match(clients, /formatAppDate/);
  assert.match(risks, /formatAppDateTime/);
  assert.match(billing, /formatAppDateOrNull/);
});

test("connector id guard is shared by OAuth routes", () => {
  const types = readSource("src/lib/connectors/types.ts");
  const authorize = readSource("src/app/api/connectors/oauth/[connectorId]/authorize/route.ts");
  const callback = readSource("src/app/api/connectors/oauth/[connectorId]/callback/route.ts");
  assert.match(types, /export function isConnectorId/);
  assert.match(authorize, /isConnectorId/);
  assert.match(callback, /isConnectorId/);
  assert.doesNotMatch(authorize, /const CONNECTOR_IDS/);
  assert.doesNotMatch(callback, /const CONNECTOR_IDS/);
});

test("billing and plans pages delegate to billing services", () => {
  const plansPage = readSource("src/app/(dashboard)/settings/plans/page.tsx");
  const billingPage = readSource("src/app/(dashboard)/settings/billing/page.tsx");
  const plansService = readSource("src/lib/billing/plans-page.ts");
  const billingService = readSource("src/lib/billing/billing-page.ts");
  assert.match(plansPage, /loadWorkspacePlansPageModel/);
  assert.match(plansService, /export async function loadWorkspacePlansPageModel/);
  assert.doesNotMatch(plansPage, /createFallbackPricingSelection/);
  assert.match(billingPage, /loadBillingSettingsPageModel/);
  assert.match(billingService, /export async function loadBillingSettingsPageModel/);
  assert.doesNotMatch(billingPage, /resolveBillingContactCard/);
});

test("SLA policy page uses listSlaActivityForPolicy not inline DB", () => {
  const page = readSource("src/app/(dashboard)/settings/sla/[id]/page.tsx");
  assert.match(page, /listSlaActivityForPolicy/);
  assert.doesNotMatch(page, /createClient/);
  assert.doesNotMatch(page, /from\(\"sla_activity\"\)/);
});

test("status page delegates live probes to marketing service", () => {
  const page = readSource("src/app/(marketing)/status/page.tsx");
  const service = readSource("src/lib/marketing/public-status.ts");
  assert.match(page, /getLiveStatusOverrides/);
  assert.match(service, /export async function getLiveStatusOverrides/);
  assert.doesNotMatch(page, /checkDatabaseHealth/);
});

test("dead Stripe dispatcher shim and kpi card are removed", () => {
  assert.equal(existsSync(join(rootDir, "src/lib/api/webhooks/dispatcher.ts")), false);
  assert.equal(existsSync(join(rootDir, "src/components/dashboard/dashboard-kpi-card.tsx")), false);
});

test("status level type lives in lib not only UI", () => {
  const types = readSource("src/lib/marketing/status-types.ts");
  const badge = readSource("src/components/marketing/status-badge.tsx");
  assert.match(types, /export type StatusLevel/);
  assert.match(badge, /from \"@\/lib\/marketing\/status-types\"/);
});
