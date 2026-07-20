import assert from "node:assert/strict";
import test from "node:test";
import {
  assertDocAndRule,
  ENTERPRISE_REGRESSION_SUITE,
  pathExists,
  readSource,
} from "./_test-helpers/read-source.mjs";

test("Build Bible V2 Chapter 15 code quality doc and rule exist", () => {
  const { doc, rule } = assertDocAndRule({
    docRelativePath: "docs/17_BUILD_BIBLE_V2_CHAPTER_15_CODE_QUALITY.md",
    ruleRelativePath: ".cursor/rules/build-bible-v2-ch15-code-quality.mdc",
  });
  assert.match(doc, /Code Quality|Maintainability/);
  assert.match(doc, /technical-debt/);
  assert.match(doc, /CompactEmptyState|StatusBadge/);
  assert.match(rule, /Do not modify/);
  assert.match(rule, /as any|TODO/);
});

test("technical debt catalog exists with severity matrix", () => {
  assert.ok(pathExists("docs/technical-debt.md"));
  const debt = readSource("docs/technical-debt.md");
  assert.match(debt, /Critical/);
  assert.match(debt, /as never/);
  assert.match(debt, /Completed in Chapter 15/);
});

test("architecture doc is Paddle-only", () => {
  const architecture = readSource("docs/architecture.md");
  assert.match(architecture, /Paddle/);
  assert.match(architecture, /\/api\/paddle\/webhook/);
  assert.doesNotMatch(architecture, /API --> Stripe/);
  assert.doesNotMatch(architecture, /Checkout and customer portal use Stripe/);
});

test("build-bible chapter tests use shared readSource helpers", () => {
  for (const chapter of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15]) {
    const source = readSource(`scripts/build-bible-ch${chapter}.test.mjs`);
    assert.match(source, /_test-helpers\/read-source\.mjs/);
    assert.doesNotMatch(source, /function readSource\(/);
  }
});

test("enterprise regression suite includes chapter 15 and code quality", () => {
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("build-bible-ch15")));
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("code-quality")));
});

test("package.json exposes chapter 15 and code quality scripts", () => {
  const pkg = readSource("package.json");
  assert.match(pkg, /"test:build-bible-ch15"/);
  assert.match(pkg, /"test:code-quality"/);
});
