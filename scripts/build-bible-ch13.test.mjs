import assert from "node:assert/strict";
import test from "node:test";
import {
  assertDocAndRule,
  ENTERPRISE_REGRESSION_SUITE,
  pathExists,
  readSource,
} from "./_test-helpers/read-source.mjs";

test("Build Bible V2 Chapter 13 regression doc and rule exist", () => {
  const { doc, rule } = assertDocAndRule({
    docRelativePath: "docs/15_BUILD_BIBLE_V2_CHAPTER_13_REGRESSION.md",
    ruleRelativePath: ".cursor/rules/build-bible-v2-ch13-regression.mdc",
  });
  assert.match(doc, /Enterprise Regression/);
  assert.match(doc, /enterprise-regression/);
  assert.match(rule, /ENTERPRISE_REGRESSION_SUITE|enterprise regression/i);
  assert.match(rule, /Do not modify/);
});

test("shared test helpers exist and are used by chapter 13 suites", () => {
  assert.ok(pathExists("scripts/_test-helpers/read-source.mjs"));
  const helpers = readSource("scripts/_test-helpers/read-source.mjs");
  assert.match(helpers, /export function readSource/);
  assert.match(helpers, /ENTERPRISE_REGRESSION_SUITE/);
  assert.match(helpers, /listApiV1RouteFiles/);

  const matrix = readSource("scripts/enterprise-regression-matrix.test.mjs");
  assert.match(matrix, /_test-helpers\/read-source\.mjs/);
  assert.match(matrix, /RBAC/);
  assert.match(matrix, /withApiHandler/);
  assert.match(matrix, /client portal/);

  const runner = readSource("scripts/run-enterprise-regression.mjs");
  assert.match(runner, /ENTERPRISE_REGRESSION_SUITE/);
});

test("enterprise regression suite includes prior Build Bible chapters and paddle", () => {
  for (const chapter of [1, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]) {
    assert.ok(
      ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes(`build-bible-ch${chapter}.test.mjs`)),
      `missing chapter ${chapter}`,
    );
  }
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("paddle-billing")));
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("technical-seo")));
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("workspace-currency")));
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("production-readiness")));
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("code-quality")));
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("technical-debt")));
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("definition-of-done")));
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("enterprise-certification")));
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("enterprise-release-approval")));
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("enterprise-production-golive")));
});

test("password reset e2e is included in Playwright smoke project", () => {
  const config = readSource("playwright.config.ts");
  assert.match(config, /password-reset/);
});

test("package.json exposes enterprise regression scripts", () => {
  const pkg = readSource("package.json");
  assert.match(pkg, /"test:build-bible-ch13"/);
  assert.match(pkg, /"test:enterprise-regression"/);
});
