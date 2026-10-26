/**
 * SLA compliance must reflect active breaches, "critical breaches" must only count critical
 * incidents, and the risk mitigation rate must count resolved risks without double counting.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/sla-risk-metrics.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const { computeRiskMitigationRate } = await import("@/lib/risks/mitigation");
const metrics = await import("@/lib/sla/metrics-compute");

function slaRow(overrides = {}) {
  return {
    breached: false,
    responded_at: "2026-10-20T10:20:00.000Z",
    resolved_at: null,
    started_at: "2026-10-20T10:00:00.000Z",
    response_due_at: "2026-10-20T11:00:00.000Z",
    resolution_due_at: "2026-10-21T10:00:00.000Z",
    status: "responded",
    created_at: "2026-10-20T10:00:00.000Z",
    severity: "medium",
    ...overrides,
  };
}

test("SLA compliance counts active breaches, not only completed events", () => {
  const rows = [
    slaRow({ breached: true, severity: "critical" }),
    slaRow({ breached: true, severity: "high" }),
    slaRow({ breached: false }),
    slaRow({ breached: false, status: "completed", resolved_at: "2026-10-20T18:00:00.000Z" }),
  ];
  const result = metrics.computeSlaMetrics(rows);
  assert.equal(result.compliancePercent, 50);
  assert.equal(result.breachedCount, 2);
  assert.equal(result.criticalBreaches, 1);
  assert.equal(metrics.getComplianceRate([]), 100);
});

test("risk mitigation rate counts resolved risks once", () => {
  assert.equal(computeRiskMitigationRate({ openCount: 4, mitigatedOpenCount: 0, resolvedCount: 5 }), 56);
  assert.equal(computeRiskMitigationRate({ openCount: 4, mitigatedOpenCount: 1, resolvedCount: 0 }), 25);
  assert.equal(computeRiskMitigationRate({ openCount: 0, mitigatedOpenCount: 0, resolvedCount: 0 }), 0);
});

test("SLA compliance card is not always green and the trend shows month names", () => {
  const card = readSource("src/components/sla/sla-metrics.tsx");
  assert.doesNotMatch(card, /label="Compliance" value=\{`\$\{metrics\.compliancePercent\}%`\} tone="success"/);
  const chart = readSource("src/components/sla/sla-compliance-chart.tsx");
  assert.match(chart, /formatTrendMonth\(point\.month\)/);
});
