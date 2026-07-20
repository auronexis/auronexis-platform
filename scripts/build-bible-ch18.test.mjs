import assert from "node:assert/strict";
import test from "node:test";
import {
  assertDocAndRule,
  ENTERPRISE_REGRESSION_SUITE,
  pathExists,
  readSource,
} from "./_test-helpers/read-source.mjs";

test("Build Bible V2 Chapter 18 certification doc and rule exist", () => {
  const { doc, rule } = assertDocAndRule({
    docRelativePath: "docs/20_BUILD_BIBLE_V2_CHAPTER_18_ENTERPRISE_CERTIFICATION.md",
    ruleRelativePath: ".cursor/rules/build-bible-v2-ch18-enterprise-certification.mdc",
  });
  assert.match(doc, /Enterprise Audit|Production Certification|CERTIFIED WITH OBSERVATIONS/);
  assert.match(doc, /enterprise-certification-report/);
  assert.match(rule, /CERTIFIED WITH OBSERVATIONS/);
  assert.match(rule, /Do not commit|Do not.*deploy/i);
});

test("enterprise certification report records decision and module matrix", () => {
  assert.ok(pathExists("docs/enterprise-certification-report.md"));
  const report = readSource("docs/enterprise-certification-report.md");
  assert.match(report, /CERTIFIED WITH OBSERVATIONS/);
  assert.match(report, /Module Certification/);
  assert.match(report, /Risk matrix|Risk Matrix/i);
  assert.match(report, /Overall Production Readiness/);
  assert.match(report, /Overall Enterprise Readiness/);
  assert.doesNotMatch(report, /# NOT CERTIFIED\b/);
});

test("enterprise regression suite includes chapter 18 and certification contracts", () => {
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("build-bible-ch18")));
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("enterprise-certification")));
});

test("package.json exposes chapter 18 scripts", () => {
  const pkg = readSource("package.json");
  assert.match(pkg, /"test:build-bible-ch18"/);
  assert.match(pkg, /"test:enterprise-certification"/);
});
