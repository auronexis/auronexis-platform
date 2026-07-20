import assert from "node:assert/strict";
import test from "node:test";
import {
  assertDocAndRule,
  ENTERPRISE_REGRESSION_SUITE,
  pathExists,
  readSource,
} from "./_test-helpers/read-source.mjs";

test("Build Bible V2 Chapter 19 release approval doc and rule exist", () => {
  const { doc, rule } = assertDocAndRule({
    docRelativePath: "docs/21_BUILD_BIBLE_V2_CHAPTER_19_RELEASE_APPROVAL.md",
    ruleRelativePath: ".cursor/rules/build-bible-v2-ch19-release-approval.mdc",
  });
  assert.match(doc, /Release Approval|Go\/No-Go|APPROVED WITH CONDITIONS/);
  assert.match(doc, /enterprise-release-approval-report/);
  assert.match(rule, /APPROVED WITH CONDITIONS/);
  assert.match(rule, /Do not commit|Do not.*deploy/i);
});

test("release approval report records decision and conditions", () => {
  assert.ok(pathExists("docs/enterprise-release-approval-report.md"));
  const report = readSource("docs/enterprise-release-approval-report.md");
  assert.match(report, /APPROVED WITH CONDITIONS/);
  assert.match(report, /Conditions \(every condition explicit\)/);
  assert.match(report, /Overall Risk Rating/);
  assert.match(report, /Rollback readiness/);
  assert.doesNotMatch(report, /# REJECTED\b/);
  assert.doesNotMatch(report, /# APPROVED FOR PRODUCTION\b/);
});

test("enterprise regression suite includes chapter 19 and release approval", () => {
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("build-bible-ch19")));
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("enterprise-release-approval")));
});

test("package.json exposes chapter 19 scripts", () => {
  const pkg = readSource("package.json");
  assert.match(pkg, /"test:build-bible-ch19"/);
  assert.match(pkg, /"test:enterprise-release-approval"/);
});
