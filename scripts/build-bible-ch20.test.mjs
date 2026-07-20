import assert from "node:assert/strict";
import test from "node:test";
import {
  assertDocAndRule,
  ENTERPRISE_REGRESSION_SUITE,
  pathExists,
  readSource,
} from "./_test-helpers/read-source.mjs";

test("Build Bible V2 Chapter 20 production go-live doc and rule exist", () => {
  const { doc, rule } = assertDocAndRule({
    docRelativePath: "docs/22_BUILD_BIBLE_V2_CHAPTER_20_PRODUCTION_GOLIVE.md",
    ruleRelativePath: ".cursor/rules/build-bible-v2-ch20-production-golive.mdc",
  });
  assert.match(doc, /Go-Live|Production|READY FOR OPERATOR DEPLOYMENT/);
  assert.match(doc, /enterprise-production-golive-playbook/);
  assert.match(rule, /READY FOR OPERATOR DEPLOYMENT/);
  assert.match(rule, /Do not automatically commit|do not automatically commit/i);
});

test("production go-live playbook records recommendation and phases", () => {
  assert.ok(pathExists("docs/enterprise-production-golive-playbook.md"));
  const playbook = readSource("docs/enterprise-production-golive-playbook.md");
  assert.match(playbook, /READY FOR OPERATOR DEPLOYMENT/);
  assert.match(playbook, /INCOMPLETE/);
  assert.match(playbook, /Recommended Release Version|Release version/i);
  assert.match(playbook, /Smoke-Test Checklist|smoke-test/i);
  assert.match(playbook, /rollback-plan/);
  assert.doesNotMatch(playbook, /# NOT READY FOR OPERATOR DEPLOYMENT\b/);
});

test("enterprise regression suite includes chapter 20 and go-live contracts", () => {
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("build-bible-ch20")));
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("enterprise-production-golive")));
});

test("package.json exposes chapter 20 scripts", () => {
  const pkg = readSource("package.json");
  assert.match(pkg, /"test:build-bible-ch20"/);
  assert.match(pkg, /"test:enterprise-production-golive"/);
});
