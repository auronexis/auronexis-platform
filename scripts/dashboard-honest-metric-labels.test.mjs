/**
 * Dashboard metric cards show labels derived from the workspace's data, never invented
 * trends such as "+8% this quarter" or "+2 this month".
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/dashboard-honest-metric-labels.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const { resolveDashboardOperationalMetrics, startOfCurrentMonthUtc } = await import(
  "@/lib/dashboard/operational-metrics"
);

function dashboardData(overrides = {}) {
  return {
    clientHealth: { totalClients: 12, healthyClients: 10, watchClients: 1, criticalClients: 1 },
    newClientsThisMonth: 0,
    openRiskCount: 0,
    openIncidentCount: 0,
    slaMetrics: { breachedCount: 0 },
    features: { risks: true, incidents: true, sla: true },
    ...overrides,
  };
}

const byKey = (metrics) => Object.fromEntries(metrics.map((metric) => [metric.key, metric]));

describe("operational metric labels", () => {
  it("reflect an all-clear workspace", () => {
    const metrics = byKey(resolveDashboardOperationalMetrics(dashboardData()));
    assert.equal(metrics.clients.trend, "None added this month");
    assert.equal(metrics.risks.trend, "All clear");
    assert.equal(metrics.incidents.trend, "None open");
    assert.equal(metrics.sla.trend, "Within targets");
    assert.equal(metrics.risks.tone, "info");
  });

  it("reflect real counts when there is work", () => {
    const metrics = byKey(
      resolveDashboardOperationalMetrics(
        dashboardData({
          newClientsThisMonth: 3,
          openRiskCount: 2,
          openIncidentCount: 1,
          slaMetrics: { breachedCount: 4 },
        }),
      ),
    );
    assert.equal(metrics.clients.trend, "+3 this month");
    assert.equal(metrics.risks.trend, "Needs attention");
    assert.equal(metrics.risks.tone, "warning");
    assert.equal(metrics.incidents.tone, "danger");
    assert.equal(metrics.sla.trend, "Compliance watch");
  });
});

describe("no invented trend texts in the dashboard", () => {
  it("page, guidance and card contain no placeholder trends", () => {
    const sources = [
      readSource("src/app/(dashboard)/dashboard/page.tsx"),
      readSource("src/lib/dashboard/workspace-guidance.ts"),
      readSource("src/components/dashboard/dashboard-panel.tsx"),
    ].join("\n");
    for (const phrase of ["+8% this quarter", "Tracking upward", "Stable this period", "+2 this month"]) {
      assert.ok(!sources.includes(phrase), `placeholder trend still present: ${phrase}`);
    }
  });

  it("new clients this month are counted from the clients table", () => {
    const queries = readSource("src/lib/dashboard/queries.ts");
    assert.match(queries, /getNewClientsThisMonthCount\(session\)/);
    assert.match(queries, /\.gte\("created_at", startOfCurrentMonthUtc\(\)\)/);
  });

  it("month start is computed in UTC", () => {
    assert.equal(startOfCurrentMonthUtc(new Date("2026-10-28T23:30:00Z")), "2026-10-01T00:00:00.000Z");
  });
});
