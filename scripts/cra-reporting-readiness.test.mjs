/**
 * Part 3 — CRA incident & vulnerability reporting readiness (documentation contracts).
 */
import assert from "node:assert/strict";
import test from "node:test";
import { assertFileExists, readSource } from "./_test-helpers/read-source.mjs";

const RUNBOOK = "docs/compliance/cra-reporting-runbook.md";
const MATRIX = "docs/compliance/cra-incident-classification-matrix.md";
const ROLES = "docs/compliance/cra-reporting-role-matrix.md";
const EVIDENCE = "docs/compliance/security-incident-evidence-checklist.md";
const TABLETOP = "docs/compliance/cra-reporting-tabletop.md";

test("CRA reporting runbook exists with Art. 14 timing and SRP references", () => {
  assertFileExists(RUNBOOK);
  const doc = readSource(RUNBOOK);

  assert.match(doc, /11 September 2026/);
  assert.match(doc, /24 hours|T\+24h|within \*\*24 hours\*\*/i);
  assert.match(doc, /72 hours|within \*\*72 hours\*\*/i);
  assert.match(doc, /14 days/);
  assert.match(doc, /one month/i);
  assert.match(doc, /Single Reporting Platform|SRP/);
  assert.match(doc, /ENISA/);
  assert.match(doc, /Article 14/);
  assert.match(doc, /Article 16/);
  assert.match(doc, /actively exploited/i);
  assert.match(doc, /severe incident/i);
  assert.match(doc, /Confirmed awareness timestamp|awareness timestamp/i);
  assert.match(doc, /GDPR BREACH ASSESSMENT REQUIRED|personal-data breach/i);
  assert.match(doc, /CONTRACTUAL \/ CUSTOMER OBLIGATION ASSESSMENT|contractual notification/i);
  assert.match(doc, /PENDING OPERATOR ONBOARDING/);
  assert.doesNotMatch(doc, /CRA compliant|CRA certified|ENISA approved/i);
});

test("classification matrix separates internal severity from legal reportability", () => {
  assertFileExists(MATRIX);
  const doc = readSource(MATRIX);
  assert.match(doc, /INTERNAL SEVERITY/);
  assert.match(doc, /LEGAL REPORTABILITY|CRA reporting candidate/i);
  assert.match(doc, /REPORTING CANDIDATE/);
  assert.match(doc, /NOT CURRENTLY REPORTABLE/);
  assert.match(doc, /LEGAL REVIEW REQUIRED/);
});

test("role matrix and evidence checklist exist", () => {
  assertFileExists(ROLES);
  assertFileExists(EVIDENCE);
  const roles = readSource(ROLES);
  const evidence = readSource(EVIDENCE);
  assert.match(roles, /Security Owner/);
  assert.match(roles, /Legal\/Compliance Decision Owner/);
  assert.match(roles, /Data Protection Owner/);
  assert.match(evidence, /Deployment SHA/);
  assert.match(evidence, /Preserve originals/i);
  assert.match(evidence, /UTC/);
});

test("tabletop contains exactly three scenarios and acceptance criteria", () => {
  assertFileExists(TABLETOP);
  const doc = readSource(TABLETOP);
  assert.match(doc, /exactly \*\*three\*\*|exactly three/i);
  const scenarioHeaders = doc.match(/^## SCENARIO \d+/gm) ?? [];
  assert.equal(scenarioHeaders.length, 3, `expected 3 scenario headers, found ${scenarioHeaders.length}`);
  assert.match(doc, /Who owns the incident/);
  assert.match(doc, /awareness timestamp/i);
  assert.match(doc, /authorized to submit/i);
  assert.doesNotMatch(doc, /CRA compliant|CRA certified/i);
});

test("compliance register records Part 3 readiness without compliance claim", () => {
  const register = readSource("docs/compliance/eu-compliance-control-register.md");
  const evidenceIndex = readSource("docs/compliance/compliance-evidence-index.md");
  assert.match(register, /CRA-VULN-001/);
  assert.match(register, /CRA-REP-001/);
  assert.match(register, /OPERATIONAL READINESS DOCUMENTED|DOCUMENTED/);
  assert.match(evidenceIndex, /EVD-CRA-001/);
  assert.doesNotMatch(register, /Status \| CRA COMPLIANT|CRA compliant/i);
});
