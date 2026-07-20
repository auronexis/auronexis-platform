import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import test from "node:test";
import { readSource, rootDir } from "./_test-helpers/read-source.mjs";

function walkTsFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkTsFiles(full, out);
      continue;
    }
    if (extname(entry) === ".ts" || extname(entry) === ".tsx") {
      out.push(full);
    }
  }
  return out;
}

test("Build Bible V2 Chapter 1 foundation doc exists", () => {
  assert.ok(existsSync(join(rootDir, "docs/02_BUILD_BIBLE_V2_CHAPTER_01_FOUNDATION.md")));
  const doc = readSource("docs/02_BUILD_BIBLE_V2_CHAPTER_01_FOUNDATION.md");
  assert.match(doc, /Paddle is the only active billing provider/);
  assert.match(doc, /Row Level Security/);
  assert.match(doc, /formatMoneyFromCentsLocale/);
});

test("Cursor always-apply foundation rule exists", () => {
  const rule = readSource(".cursor/rules/build-bible-v2-ch1-foundation.mdc");
  assert.match(rule, /alwaysApply:\s*true/);
  assert.match(rule, /Paddle-only billing/);
  assert.match(rule, /TODO/);
});

test("ESLint enforces any ban and Stripe import ban", () => {
  const eslint = readSource("eslint.config.mjs");
  assert.match(eslint, /no-explicit-any/);
  assert.match(eslint, /ban-ts-comment/);
  assert.match(eslint, /no-restricted-imports/);
  assert.match(eslint, /name:\s*"stripe"/);
});

test("TypeScript strict mode remains enabled", () => {
  const tsconfig = readSource("tsconfig.json");
  assert.match(tsconfig, /"strict":\s*true/);
  assert.doesNotMatch(tsconfig, /ignoreBuildErrors/);
});

test("dead Stripe runtime shim file is removed", () => {
  assert.equal(existsSync(join(rootDir, "src/lib/billing/stripe-config.ts")), false);
});

test("billing money helpers converge on canonical formatters", () => {
  const status = readSource("src/lib/billing/status.ts");
  const proration = readSource("src/lib/billing/proration.ts");
  const plans = readSource("src/lib/billing/plans.ts");
  const discounts = readSource("src/lib/billing/discounts.ts");
  assert.match(status, /formatMoneyFromCentsLocale/);
  assert.match(proration, /formatMoneyFromCentsLocale/);
  assert.doesNotMatch(proration, /currency:\s*"EUR"/);
  assert.match(plans, /formatWorkspaceMoney/);
  assert.match(discounts, /formatMoneyFromCentsLocale/);
});

test("src has no TODO or FIXME comment markers", () => {
  const files = walkTsFiles(join(rootDir, "src"));
  const hits = [];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    if (/\/\/\s*TODO\b|\/\*\s*TODO\b|\/\/\s*FIXME\b|\/\*\s*FIXME\b/.test(source)) {
      hits.push(file.replace(rootDir + "\\", "").replace(rootDir + "/", ""));
    }
  }
  assert.deepEqual(hits, [], `Forbidden TODO/FIXME comments:\n${hits.join("\n")}`);
});

test("active billing provider remains Paddle-only", () => {
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /return "paddle"/);
  assert.doesNotMatch(provider, /readLegacyBillingProviderEnv/);
});
