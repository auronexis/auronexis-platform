import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  assertDocAndRule,
  assertFileExists,
  pathExists,
  readSource,
  rootDir,
} from "./_test-helpers/read-source.mjs";

test("Build Bible V2 Chapter 14 production readiness doc and rule exist", () => {
  const { doc, rule } = assertDocAndRule({
    docRelativePath: "docs/16_BUILD_BIBLE_V2_CHAPTER_14_PRODUCTION_READINESS.md",
    ruleRelativePath: ".cursor/rules/build-bible-v2-ch14-production-readiness.mdc",
  });
  assert.match(doc, /Production Readiness|Enterprise Deployment/);
  assert.match(doc, /enterprise-deployment/);
  assert.match(doc, /Do not.*deploy|without.*deploy/i);
  assert.match(rule, /Do not.*deploy|production-deploy/i);
  assert.match(rule, /Paddle/);
});

test("canonical enterprise ops docs exist", () => {
  for (const relative of [
    "docs/enterprise-deployment.md",
    "docs/enterprise-release-checklist.md",
    "docs/rollback-plan.md",
    "docs/disaster-recovery.md",
    "docs/operations-runbook.md",
    "docs/deployment.md",
  ]) {
    assertFileExists(relative);
  }
  const deploy = readSource("docs/enterprise-deployment.md");
  assert.match(deploy, /Paddle/);
  assert.match(deploy, /test:production-readiness/);
  assert.match(deploy, /\/api\/paddle\/webhook/);
  assert.doesNotMatch(deploy, /\/api\/stripe\/webhook/);

  const checklist = readSource("docs/enterprise-release-checklist.md");
  assert.match(checklist, /Billing validation \(Paddle\)/);
  assert.match(checklist, /Rollback readiness/);
  assert.match(checklist, /Migration validation/);

  const rollback = readSource("docs/rollback-plan.md");
  assert.match(rollback, /Application rollback/);
  assert.match(rollback, /Webhook rollback \(Paddle\)/);
  assert.match(rollback, /forward-only/i);

  const dr = readSource("docs/disaster-recovery.md");
  assert.match(dr, /Paddle/);
  assert.match(dr, /Queue recovery/);
  assert.doesNotMatch(dr, /Re-register Stripe webhook/);
});

test("package.json exposes chapter 14 and production readiness scripts", () => {
  const pkg = readSource("package.json");
  assert.match(pkg, /"test:build-bible-ch14"/);
  assert.match(pkg, /"test:production-readiness"/);
});
