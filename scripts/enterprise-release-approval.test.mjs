import assert from "node:assert/strict";
import test from "node:test";
import { pathExists, readSource } from "./_test-helpers/read-source.mjs";

const CHAPTER_DOCS = [
  ["1", "docs/02_BUILD_BIBLE_V2_CHAPTER_01_FOUNDATION.md"],
  ["2", "docs/04_BUILD_BIBLE_V2_CHAPTER_02_ARCHITECTURE.md"],
  ["3", "docs/05_BUILD_BIBLE_V2_CHAPTER_03_NEXT_TYPESCRIPT.md"],
  ["4", "docs/06_BUILD_BIBLE_V2_CHAPTER_04_DESIGN_SYSTEM.md"],
  ["5", "docs/07_BUILD_BIBLE_V2_CHAPTER_05_DATABASE.md"],
  ["6", "docs/08_BUILD_BIBLE_V2_CHAPTER_06_API.md"],
  ["7", "docs/09_BUILD_BIBLE_V2_CHAPTER_07_PERFORMANCE.md"],
  ["8", "docs/10_BUILD_BIBLE_V2_CHAPTER_08_SEO.md"],
  ["9", "docs/11_BUILD_BIBLE_V2_CHAPTER_09_I18N.md"],
  ["10", "docs/12_BUILD_BIBLE_V2_CHAPTER_10_ACCESSIBILITY.md"],
  ["11", "docs/13_BUILD_BIBLE_V2_CHAPTER_11_ANALYTICS.md"],
  ["12", "docs/14_BUILD_BIBLE_V2_CHAPTER_12_PADDLE_BILLING.md"],
  ["13", "docs/15_BUILD_BIBLE_V2_CHAPTER_13_REGRESSION.md"],
  ["14", "docs/16_BUILD_BIBLE_V2_CHAPTER_14_PRODUCTION_READINESS.md"],
  ["15", "docs/17_BUILD_BIBLE_V2_CHAPTER_15_CODE_QUALITY.md"],
  ["16", "docs/18_BUILD_BIBLE_V2_CHAPTER_16_TECHNICAL_DEBT.md"],
  ["17", "docs/19_BUILD_BIBLE_V2_CHAPTER_17_DEFINITION_OF_DONE.md"],
  ["18", "docs/20_BUILD_BIBLE_V2_CHAPTER_18_ENTERPRISE_CERTIFICATION.md"],
  ["19", "docs/21_BUILD_BIBLE_V2_CHAPTER_19_RELEASE_APPROVAL.md"],
];

test("chapters 1–19 remain Status Implemented for release board", () => {
  for (const [chapter, relative] of CHAPTER_DOCS) {
    assert.ok(pathExists(relative), `missing chapter ${chapter}: ${relative}`);
    assert.match(readSource(relative), /Status:\*\* Implemented/, `chapter ${chapter}`);
  }
});

test("prior gates GO WITH CONDITIONS and CERTIFIED WITH OBSERVATIONS remain", () => {
  assert.match(readSource("docs/enterprise-dod-report.md"), /GO WITH CONDITIONS/);
  assert.match(readSource("docs/enterprise-certification-report.md"), /CERTIFIED WITH OBSERVATIONS/);
});

test("release decision is APPROVED WITH CONDITIONS with explicit conditions", () => {
  const chapter = readSource("docs/21_BUILD_BIBLE_V2_CHAPTER_19_RELEASE_APPROVAL.md");
  const report = readSource("docs/enterprise-release-approval-report.md");
  assert.match(chapter, /APPROVED WITH CONDITIONS/);
  assert.match(report, /# APPROVED WITH CONDITIONS|# Final decision: APPROVED WITH CONDITIONS/);
  assert.match(report, /enterprise-release-checklist/);
  assert.match(report, /PADDLE_ENVIRONMENT=production|Paddle live|live keys/i);
  assert.match(report, /rollback-plan/);
  assert.match(report, /does \*\*not\*\* itself perform commit|Do not commit|does \*\*not\*\* authorize commit/i);
});

test("no critical release blockers remain open", () => {
  const report = readSource("docs/enterprise-release-approval-report.md");
  assert.match(report, /Critical Blocker\*\*.*None|Critical Risks \(release blockers\)\s*\|\s*\*\*None\*\*/i);
  assert.match(report, /Critical security findings remaining:\*\* none/i);
});

test("production ops artifacts required for approval exist", () => {
  for (const relative of [
    "docs/enterprise-release-checklist.md",
    "docs/enterprise-deployment.md",
    "docs/rollback-plan.md",
    "docs/disaster-recovery.md",
    "docs/paddle-billing.md",
    "docs/technical-debt.md",
  ]) {
    assert.ok(pathExists(relative), `missing ${relative}`);
  }
});

test("chapter 19 always-apply rule is installed", () => {
  const rule = ".cursor/rules/build-bible-v2-ch19-release-approval.mdc";
  assert.ok(pathExists(rule));
  assert.match(readSource(rule), /alwaysApply:\s*true/);
});

test("paddle sole webhook path still required for release", () => {
  assert.ok(pathExists("src/app/api/paddle/webhook/route.ts"));
  assert.equal(pathExists("src/app/api/stripe"), false);
});
