/**
 * One health score everywhere: the canonical client score (health engine) drives the client
 * page, Customer Success, the AI client-success panel and the dashboard workspace health.
 * The profitability status is labelled as a margin status.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/one-health-score.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const { successStatusFromCanonicalScore } = await import("@/lib/customer-success/health");
const { computeWorkspaceHealth } = await import("@/lib/ai/insights/scoring");
const { computeClientHealthScore, healthLabelFromScore } = await import("@/lib/ai/client-success/scoring");
const { MARGIN_STATUS_LABELS } = await import("@/lib/profitability/types");
const { scoreToHealthStatus } = await import("@/lib/health/types");

test("customer success status follows the canonical score bands", () => {
  assert.equal(successStatusFromCanonicalScore(100, false), "healthy");
  assert.equal(successStatusFromCanonicalScore(70, false), "healthy");
  assert.equal(successStatusFromCanonicalScore(67, false), "watch");
  assert.equal(successStatusFromCanonicalScore(49, false), "critical");
  assert.equal(successStatusFromCanonicalScore(90, true), "insufficient_data");
  for (const score of [95, 88, 67, 58, 40]) {
    const canonical = scoreToHealthStatus(score);
    const success = successStatusFromCanonicalScore(score, false);
    const expected = canonical === "excellent" ? "healthy" : canonical;
    assert.equal(success, expected, `score ${score}`);
  }
});

test("workspace health is the average client health score", () => {
  const snapshot = { clients: [100, 100, 88, 67, 58].map((healthScore) => ({ healthScore })) };
  assert.deepEqual(computeWorkspaceHealth(snapshot), { score: 83, label: "Good" });
  assert.deepEqual(computeWorkspaceHealth({ clients: [] }), { score: 100, label: "Excellent" });
});

test("AI client-success panel uses the canonical score and the same bands", () => {
  assert.equal(computeClientHealthScore({ clientHealthScore: 67 }), 67);
  assert.equal(healthLabelFromScore(67), "watch");
  assert.equal(healthLabelFromScore(70), "healthy");
  assert.equal(healthLabelFromScore(45), "critical");
});

test("profitability status reads as a margin status, not client health", () => {
  assert.equal(MARGIN_STATUS_LABELS.critical, "Margin at risk");
  const badge = readSource("src/components/profitability/client-health-badge.tsx");
  assert.match(badge, /MARGIN_STATUS_LABELS\[health\]/);
  const page = readSource("src/app/(dashboard)/clients/[id]/page.tsx");
  assert.doesNotMatch(page, /label="Computed health"/);
  assert.match(page, /<DetailKpiStat label="Client health">\s*<ClientHealthScore score=\{client\.health_score\} \/>/);
});

test("mitigated risks no longer count as SLA violations in the health engine", () => {
  const source = readSource("src/lib/health/queries.ts");
  assert.match(source, /\(resolved,dismissed,mitigated\)/);
});
