import assert from "node:assert/strict";
import test from "node:test";
import {
  assertDocAndRule,
  ENTERPRISE_REGRESSION_SUITE,
  pathExists,
  readSource,
} from "./_test-helpers/read-source.mjs";

test("Build Bible V2 Chapter 17 Definition of Done doc and rule exist", () => {
  const { doc, rule } = assertDocAndRule({
    docRelativePath: "docs/19_BUILD_BIBLE_V2_CHAPTER_17_DEFINITION_OF_DONE.md",
    ruleRelativePath: ".cursor/rules/build-bible-v2-ch17-definition-of-done.mdc",
  });
  assert.match(doc, /Definition of Done|Release Gates/);
  assert.match(doc, /GO WITH CONDITIONS|enterprise-definition-of-done/);
  assert.match(rule, /Do not commit|Do not.*deploy/i);
  assert.match(rule, /ModulePlaceholder|TODO/);
});

test("DoD checklist and audit report exist with release recommendation", () => {
  assert.ok(pathExists("docs/enterprise-definition-of-done.md"));
  assert.ok(pathExists("docs/enterprise-dod-report.md"));
  const checklist = readSource("docs/enterprise-definition-of-done.md");
  assert.match(checklist, /Feature completeness matrix/);
  assert.match(checklist, /Security readiness/);
  assert.match(checklist, /test:definition-of-done/);
  const report = readSource("docs/enterprise-dod-report.md");
  assert.match(report, /GO WITH CONDITIONS/);
  assert.match(report, /Enterprise Readiness/);
  assert.match(report, /Production Readiness/);
});

test("enterprise regression suite includes chapter 17 and DoD contracts", () => {
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("build-bible-ch17")));
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("definition-of-done")));
});

test("package.json exposes chapter 17 scripts", () => {
  const pkg = readSource("package.json");
  assert.match(pkg, /"test:build-bible-ch17"/);
  assert.match(pkg, /"test:definition-of-done"/);
});
