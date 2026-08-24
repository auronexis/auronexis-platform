/**
 * P1-006 — Compliance framework readiness semantics + production verification.
 * Asserts formulas, platform vs tenant separation, evidence rules, and UI language.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { readSource, pathExists } from "./_test-helpers/read-source.mjs";

/** Mirrors src/lib/governance/maturity-formula.ts — keep in sync. */
function computeWorkspaceComplianceMaturity(input) {
  const readinessPercent = Math.min(
    100,
    Math.round(
      input.retentionCoveragePercent * 0.2 +
        Math.min(input.activePolicies * 10, 30) +
        (input.auditEventsTotal > 0 ? 20 : 0) +
        (input.auditGrowth7d > 0 ? 5 : 0) +
        input.controlAverage * 0.3,
    ),
  );
  const maturityScore = Math.min(
    100,
    Math.round((readinessPercent + input.controlAverage) / 2),
  );
  const readinessLevel =
    maturityScore >= 85
      ? "optimized"
      : maturityScore >= 70
        ? "managed"
        : maturityScore >= 45
          ? "developing"
          : "initial";
  return { readinessPercent, maturityScore, readinessLevel };
}

function countImplementedControlsWithEvidence(frameworkControls, scores) {
  return frameworkControls.filter((control) =>
    scores.some(
      (score) =>
        score.control === control && score.evidenceAvailable && score.status !== "fail",
    ),
  ).length;
}

test("empty workspace maturity is ~0 when control average is 0 (not platform failure)", () => {
  const empty = computeWorkspaceComplianceMaturity({
    retentionCoveragePercent: 0,
    activePolicies: 0,
    auditEventsTotal: 0,
    auditGrowth7d: 0,
    controlAverage: 0,
  });
  assert.equal(empty.readinessPercent, 0);
  assert.equal(empty.maturityScore, 0);
  assert.equal(empty.readinessLevel, "initial");
});

test("legacy inflated empty-tenant ~18% required fabricated control baselines", () => {
  // Historical production observation used hardcoded control averages (~58) without evidence.
  const legacyInflated = computeWorkspaceComplianceMaturity({
    retentionCoveragePercent: 0,
    activePolicies: 0,
    auditEventsTotal: 0,
    auditGrowth7d: 0,
    controlAverage: 58.4375,
  });
  assert.equal(legacyInflated.readinessPercent, 18);
});

test("partial tenant maturity increases with policies, retention, and audit evidence", () => {
  const partial = computeWorkspaceComplianceMaturity({
    retentionCoveragePercent: 50,
    activePolicies: 2,
    auditEventsTotal: 5,
    auditGrowth7d: 0,
    controlAverage: 40,
  });
  // 50*0.2 + min(20,30) + 20 + 0 + 40*0.3 = 10+20+20+12 = 62
  assert.equal(partial.readinessPercent, 62);
  assert.equal(partial.readinessLevel, "developing");
});

test("mature tenant can reach high maturity without claiming certification", () => {
  const mature = computeWorkspaceComplianceMaturity({
    retentionCoveragePercent: 100,
    activePolicies: 4,
    auditEventsTotal: 100,
    auditGrowth7d: 10,
    controlAverage: 85,
  });
  // 20 + 30 + 20 + 5 + 25.5 = 100.5 → 100
  assert.equal(mature.readinessPercent, 100);
  assert.ok(mature.maturityScore >= 85);
  assert.equal(mature.readinessLevel, "optimized");
});

test("controls without evidence are not counted as implemented", () => {
  const controls = ["identity", "logging", "retention"];
  const scores = [
    { control: "identity", status: "pass", evidenceAvailable: false, score: 80 },
    { control: "logging", status: "partial", evidenceAvailable: true, score: 55 },
    { control: "retention", status: "fail", evidenceAvailable: true, score: 20 },
  ];
  assert.equal(countImplementedControlsWithEvidence(controls, scores), 1);
});

test("maturity formula source documents exact weights", () => {
  const formula = readSource("src/lib/governance/maturity-formula.ts");
  assert.match(formula, /retentionCoveragePercent \* 0\.2/);
  assert.match(formula, /Math\.min\(input\.activePolicies \* 10, 30\)/);
  assert.match(formula, /auditEventsTotal > 0 \? 20 : 0/);
  assert.match(formula, /auditGrowth7d > 0 \? 5 : 0/);
  assert.match(formula, /controlAverage \* 0\.3/);
  assert.match(formula, /not SOC 2|not certification/i);
});

test("control scoring requires tenant-backed evidence and does not invent pass from zero open incidents", () => {
  const controls = readSource("src/lib/governance/controls.ts");
  assert.match(controls, /Zero open incidents is NOT evidence/i);
  assert.match(controls, /evidenceAvailable/);
  assert.doesNotMatch(controls, /evidenceAvailable:\s*score\s*>=\s*50/);
  assert.doesNotMatch(controls, /incident_management:\s*incidentsOpen\s*===\s*0\s*\?\s*80/);
  assert.doesNotMatch(controls, /identity:\s*85/);
});

test("diagnostics separate platform capability from workspace maturity", () => {
  const diagnostics = readSource("src/lib/compliance/diagnostics.ts");
  assert.match(diagnostics, /workspaceComplianceMaturityPercent/);
  assert.match(diagnostics, /platformCapabilityPercent/);
  assert.match(diagnostics, /computeCompliancePlatformCapabilityPercent/);
  const types = readSource("src/lib/compliance/types.ts");
  assert.match(types, /workspaceComplianceMaturityPercent/);
  assert.match(types, /platformCapabilityPercent/);
});

test("production readiness uses tablesReachable only for compliance — not tenant maturity", () => {
  const readiness = readSource("src/lib/diagnostics/production-readiness.ts");
  assert.match(readiness, /workspace compliance maturity must not gate go-live/i);
  assert.doesNotMatch(readiness, /maturityPercent/);
  assert.match(readiness, /tableReachable:\s*data\.compliance\.tablesReachable/);
  const formula = readSource("src/lib/governance/maturity-formula.ts");
  assert.match(formula, /computeComplianceProductionReadinessScore/);
  assert.match(formula, /tablesReachable \? 90 : 40/);
});

test("UI language distinguishes maturity from certification and empty configuration", () => {
  const panel = readSource("src/components/settings/diagnostics-panel.tsx");
  assert.match(panel, /Workspace compliance maturity/);
  assert.match(panel, /Platform capability/);
  assert.match(panel, /not yet configured/);
  assert.match(panel, /not SOC 2/);
  assert.doesNotMatch(panel, /label="Framework readiness"/);

  const workspace = readSource("src/components/compliance/compliance-workspace.tsx");
  assert.match(workspace, /Framework evidence coverage/);
  assert.match(workspace, /not SOC 2/);
  assert.match(workspace, /not yet configured/);

  const dashboard = readSource("src/app/(dashboard)/dashboard/page.tsx");
  assert.match(dashboard, /Framework maturity/);
  assert.match(dashboard, /not certification/);
});

test("default policy scaffolding is draft-only and does not overwrite existing rows", () => {
  const policies = readSource("src/lib/compliance/policies.ts");
  assert.match(policies, /status: "draft"/);
  assert.match(policies, /Never overwrites/);
  assert.doesNotMatch(policies, /status: "active"/);
  assert.doesNotMatch(policies, /\.upsert\(/);
});

test("no fake certification claims in remediation surfaces", () => {
  const docs = [
    "src/components/compliance/compliance-workspace.tsx",
    "src/components/settings/diagnostics-panel.tsx",
    "src/lib/governance/maturity-formula.ts",
    "docs/p1-006-compliance-framework-readiness-remediation.md",
  ];
  for (const relative of docs) {
    assert.equal(pathExists(relative), true, relative);
    const src = readSource(relative);
    assert.doesNotMatch(src, /we are SOC 2 certified|ISO 27001 certified|HIPAA certified/i);
  }
});

test("MOLLIE_LIVE_CHARGING_ENABLED remains fail-closed and untouched", () => {
  const env = readSource(".env.example");
  assert.match(env, /MOLLIE_LIVE_CHARGING_ENABLED=false/);
  const thisFile = readSource("scripts/p1-006-compliance-framework-readiness.test.mjs");
  assert.doesNotMatch(thisFile, /MOLLIE_LIVE_CHARGING_ENABLED\s*=\s*true/);
});
