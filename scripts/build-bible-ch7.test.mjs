import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { readSource, rootDir } from "./_test-helpers/read-source.mjs";

test("Build Bible V2 Chapter 7 performance doc and rule exist", () => {
  assert.ok(existsSync(join(rootDir, "docs/09_BUILD_BIBLE_V2_CHAPTER_07_PERFORMANCE.md")));
  const doc = readSource("docs/09_BUILD_BIBLE_V2_CHAPTER_07_PERFORMANCE.md");
  assert.match(doc, /Status:\*\* Implemented/);
  const rule = readSource(".cursor/rules/build-bible-v2-ch7-performance.mdc");
  assert.match(rule, /alwaysApply:\s*true/);
  assert.match(rule, /React `cache\(\)`/);
});

test("hot loaders use React cache for request memoization", () => {
  const dashboard = readSource("src/lib/dashboard/queries.ts");
  const plans = readSource("src/lib/plans/queries.ts");
  const clients = readSource("src/lib/clients/queries.ts");
  const reports = readSource("src/lib/reports/queries.ts");
  const incidents = readSource("src/lib/incidents/queries.ts");
  const risks = readSource("src/lib/risks/queries.ts");

  assert.match(dashboard, /export const getDashboardData = cache\(/);
  assert.match(plans, /export const getOrganizationPlanContext = cache\(/);
  assert.match(clients, /export const getClientById = cache\(/);
  assert.match(reports, /export const getReportById = cache\(/);
  assert.match(incidents, /export const getIncidentById = cache\(/);
  assert.match(risks, /export const getRiskById = cache\(/);
});

test("dashboard loads SLA metrics without write-side processors on the read path", () => {
  const dashboard = readSource("src/lib/dashboard/queries.ts");
  const fnStart = dashboard.indexOf("export const getDashboardData = cache");
  assert.ok(fnStart > 0);
  const body = dashboard.slice(fnStart, fnStart + 3500);
  assert.doesNotMatch(body, /processOrganizationSlaAlerts/);
  assert.doesNotMatch(body, /processOrganizationReportOverdueEscalations/);
  assert.match(body, /getSlaDashboardMetrics/);
  assert.match(body, /getDashboardMetrics/);
  assert.match(body, /Promise\.all/);
});

test("profitability rows are request-memoized to prevent duplicate org rebuilds", () => {
  const profitability = readSource("src/lib/profitability/queries.ts");
  assert.match(profitability, /export const buildClientProfitabilityRows = cache\(/);
});

test("portfolio builders cap work and use concurrency helper", () => {
  const helper = readSource("src/lib/performance/map-with-concurrency.ts");
  const aiPortfolio = readSource("src/lib/ai/client-success/portfolio.ts");
  const csPortfolio = readSource("src/lib/customer-success/snapshot.ts");

  assert.match(helper, /export async function mapWithConcurrency/);
  assert.match(aiPortfolio, /PORTFOLIO_PAGE_SIZE/);
  assert.match(aiPortfolio, /mapWithConcurrency/);
  assert.match(csPortfolio, /PORTFOLIO_PAGE_SIZE/);
  assert.match(csPortfolio, /mapWithConcurrency/);

  const predictive = readSource("src/lib/predictive/queries.ts");
  assert.match(predictive, /PORTFOLIO_PAGE_SIZE/);
  assert.match(predictive, /mapWithConcurrency/);
});

test("heavy workspaces are dynamically imported", () => {
  const lazy = readSource("src/components/performance/lazy-workspaces.tsx");
  assert.match(lazy, /KnowledgeHubWorkspaceLazy/);
  assert.match(lazy, /PredictiveWorkspaceLazy/);
  assert.match(lazy, /CopilotWorkspaceLazy/);
  assert.match(lazy, /ComplianceWorkspaceLazy/);
  assert.match(lazy, /WhiteLabelWorkspaceLazy/);
  assert.match(lazy, /ApiSettingsWorkspaceLazy/);
  assert.match(lazy, /IntegrationCenterWorkspaceLazy/);

  const knowledge = readSource("src/app/(dashboard)/knowledge/page.tsx");
  const predictive = readSource("src/app/(dashboard)/predictive/page.tsx");
  const copilot = readSource("src/app/(dashboard)/copilot/page.tsx");
  assert.match(knowledge, /KnowledgeHubWorkspaceLazy/);
  assert.match(predictive, /PredictiveWorkspaceLazy/);
  assert.match(copilot, /CopilotWorkspaceLazy/);
  assert.doesNotMatch(knowledge, /from \"@\/components\/knowledge\/knowledge-hub-workspace\"/);
});

test("job dispatcher skips overlapping executions", () => {
  const dispatcher = readSource("src/lib/jobs/dispatcher.ts");
  const scheduler = readSource("src/lib/jobs/scheduler.ts");
  assert.match(scheduler, /export async function hasRunningJobExecution/);
  assert.match(dispatcher, /hasRunningJobExecution/);
  assert.match(dispatcher, /already_running/);
});

test("dashboard page parallelizes feature checks and optional hubs", () => {
  const page = readSource("src/app/(dashboard)/dashboard/page.tsx");
  assert.match(page, /checkPlanFeatureForSession\(session, \"ai_report_assistant\"\)/);
  assert.match(page, /buildCustomerSuccessPortfolio/);
  assert.match(page, /buildAdoptionSnapshot/);
  assert.match(page, /buildSmartRecommendations/);
  const adoptionBlockStart = page.indexOf("const [adoption, smartRecommendations, customerSuccessPortfolio]");
  assert.ok(adoptionBlockStart > 0);
  assert.match(page.slice(adoptionBlockStart, adoptionBlockStart + 600), /Promise\.all/);
});
