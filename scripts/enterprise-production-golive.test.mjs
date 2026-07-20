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
  ["20", "docs/22_BUILD_BIBLE_V2_CHAPTER_20_PRODUCTION_GOLIVE.md"],
];

test("chapters 1–20 remain Status Implemented for go-live", () => {
  for (const [chapter, relative] of CHAPTER_DOCS) {
    assert.ok(pathExists(relative), `missing chapter ${chapter}: ${relative}`);
    assert.match(readSource(relative), /Status:\*\* Implemented/, `chapter ${chapter}`);
  }
});

test("chapter 19 approval remains APPROVED WITH CONDITIONS", () => {
  assert.match(readSource("docs/enterprise-release-approval-report.md"), /APPROVED WITH CONDITIONS/);
});

test("go-live recommendation is READY FOR OPERATOR DEPLOYMENT", () => {
  const chapter = readSource("docs/22_BUILD_BIBLE_V2_CHAPTER_20_PRODUCTION_GOLIVE.md");
  const playbook = readSource("docs/enterprise-production-golive-playbook.md");
  assert.match(chapter, /READY FOR OPERATOR DEPLOYMENT/);
  assert.match(playbook, /# Recommendation: READY FOR OPERATOR DEPLOYMENT|# READY FOR OPERATOR DEPLOYMENT/);
});

test("playbook marks Ch19 operator conditions and forbids auto deploy language", () => {
  const playbook = readSource("docs/enterprise-production-golive-playbook.md");
  assert.match(playbook, /\|\s*1\s*\|.*\|\s*\*\*INCOMPLETE\*\*/);
  assert.match(playbook, /\|\s*2\s*\|.*\|\s*\*\*INCOMPLETE\*\*/);
  assert.match(playbook, /BLOCKED items:\*\* none/i);
  assert.match(playbook, /DO NOT EXECUTE|Do not promote|must not commit/i);
  assert.match(playbook, /v1\.1\.0|1\.1\.0/);
  assert.match(playbook, /release\/1\.1\.0/);
});

test("deployment and rollback sources of truth exist", () => {
  for (const relative of [
    "docs/enterprise-deployment.md",
    "docs/enterprise-release-checklist.md",
    "docs/rollback-plan.md",
    "docs/disaster-recovery.md",
    "docs/paddle-billing.md",
  ]) {
    assert.ok(pathExists(relative), `missing ${relative}`);
  }
});

test("smoke-test checklist covers billing and portal", () => {
  const playbook = readSource("docs/enterprise-production-golive-playbook.md");
  assert.match(playbook, /Client portal|portal/i);
  assert.match(playbook, /Checkout/);
  assert.match(playbook, /Password reset/i);
  assert.match(playbook, /Developer APIs/i);
});

test("chapter 20 always-apply rule is installed", () => {
  const rule = ".cursor/rules/build-bible-v2-ch20-production-golive.mdc";
  assert.ok(pathExists(rule));
  assert.match(readSource(rule), /alwaysApply:\s*true/);
});

test("paddle webhook route remains the sole billing webhook", () => {
  assert.ok(pathExists("src/app/api/paddle/webhook/route.ts"));
  assert.equal(pathExists("src/app/api/stripe"), false);
});
