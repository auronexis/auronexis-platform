/**
 * The customer-success portfolio no longer holds back the dashboard: the guidance section
 * streams behind Suspense, skips the portfolio when its panels cannot be shown, and the
 * portfolio answers per-client playbook/task/risk/incident lookups from org-wide rows.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/dashboard-stream-guidance.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

describe("dashboard guidance streaming", () => {
  const page = readSource("src/app/(dashboard)/dashboard/page.tsx");
  const section = readSource("src/components/dashboard/dashboard-guidance-section.tsx");

  it("the page renders the guidance section inside Suspense and no longer awaits the portfolio", () => {
    assert.match(page, /<Suspense fallback=\{<DashboardGuidanceSkeleton \/>\}>\s*<DashboardGuidanceSection/);
    assert.doesNotMatch(page, /buildCustomerSuccessPortfolio/);
    assert.doesNotMatch(page, /buildExecutiveIntelligenceSnapshot/);
  });

  it("the section skips the portfolio and executive snapshot when their panels are hidden", () => {
    assert.match(
      section,
      /guidanceMode !== "activation_primary" && guidanceMode !== "adoption_risk"/,
    );
    assert.match(section, /showsInsightPanels && canReadCustomerSuccess\s*\?\s*await buildCustomerSuccessPortfolio/);
    assert.match(section, /showsInsightPanels && canReadExecutiveIntelligence\s*\?\s*await buildExecutiveIntelligenceSnapshot/);
  });

  it("the section keeps the original panels and logs its own slow phases", () => {
    for (const component of [
      "CustomerSuccessSummaryPanel",
      "ExecutiveIntelligenceSummaryPanel",
      "SmartRecommendations",
      "ActivationPanel",
      "AdoptionSummaryPanel",
      "DashboardQuickActions",
    ]) {
      assert.match(section, new RegExp(`<${component}`));
    }
    assert.match(section, /timer\.logIfSlow\("\/dashboard#guidance"\)/);
  });
});

describe("customer-success portfolio queries", () => {
  const snapshot = readSource("src/lib/customer-success/snapshot.ts");
  const queries = readSource("src/lib/customer-success/queries.ts");

  it("loads open risks and incidents for all clients at once", () => {
    assert.match(snapshot, /loadOpenWorkCountsByClient\(session\.organization\.id\)/);
    assert.match(queries, /\.in\("status", \["open", "acknowledged", "mitigated"\]\)[\s\S]*?\.in\("status", \["open", "investigating"\]\)/);
  });

  it("per-client snapshots use the preloaded rows when given", () => {
    assert.match(snapshot, /preloaded,\s*\}\),\s*\);/);
    assert.match(snapshot, /preloaded\.instances\.filter\(\(row\) => row\.client_id === clientId\)/);
    assert.match(snapshot, /preloaded\.tasks\.filter\(\(row\) => row\.client_id === clientId\)/);
  });
});
