import assert from "node:assert/strict";
import test from "node:test";
import {
  assertDocAndRule,
  ENTERPRISE_REGRESSION_SUITE,
  pathExists,
  readSource,
} from "./_test-helpers/read-source.mjs";

test("Build Bible V2 Chapter 16 technical debt doc and rule exist", () => {
  const { doc, rule } = assertDocAndRule({
    docRelativePath: "docs/18_BUILD_BIBLE_V2_CHAPTER_16_TECHNICAL_DEBT.md",
    ruleRelativePath: ".cursor/rules/build-bible-v2-ch16-technical-debt.mdc",
  });
  assert.match(doc, /Technical Debt/);
  assert.match(doc, /technical-debt-inventory-ch16/);
  assert.match(rule, /Do not commit|Do not.*deploy/i);
  assert.match(rule, /as never|Paddle/);
});

test("chapter 16 inventory and catalog exist", () => {
  assert.ok(pathExists("docs/technical-debt-inventory-ch16.md"));
  assert.ok(pathExists("docs/technical-debt.md"));
  const inventory = readSource("docs/technical-debt-inventory-ch16.md");
  assert.match(inventory, /Critical Technical Debt/);
  assert.match(inventory, /Safe To Remove/);
  assert.match(inventory, /Version 2 recommendations/);
  const catalog = readSource("docs/technical-debt.md");
  assert.match(catalog, /Completed in Chapter 16/);
});

test("enterprise regression suite includes chapter 16 and technical debt", () => {
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("build-bible-ch16")));
  assert.ok(ENTERPRISE_REGRESSION_SUITE.some((entry) => entry.includes("technical-debt.test")));
});

test("package.json exposes chapter 16 scripts", () => {
  const pkg = readSource("package.json");
  assert.match(pkg, /"test:build-bible-ch16"/);
  assert.match(pkg, /"test:technical-debt"/);
  assert.match(pkg, /"verify:domain-routing"/);
});
