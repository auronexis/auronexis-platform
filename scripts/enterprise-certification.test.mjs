import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { pathExists, readSource, rootDir } from "./_test-helpers/read-source.mjs";

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
];

test("chapters 1–18 remain Status Implemented for certification", () => {
  for (const [chapter, relative] of CHAPTER_DOCS) {
    assert.ok(pathExists(relative), `missing chapter ${chapter}: ${relative}`);
    assert.match(readSource(relative), /Status:\*\* Implemented/, `chapter ${chapter}`);
  }
});

test("chapter 18 always-apply rule is installed", () => {
  const rule = ".cursor/rules/build-bible-v2-ch18-enterprise-certification.mdc";
  assert.ok(pathExists(rule));
  assert.match(readSource(rule), /alwaysApply:\s*true/);
});

test("certification decision is CERTIFIED WITH OBSERVATIONS", () => {
  const chapter = readSource("docs/20_BUILD_BIBLE_V2_CHAPTER_18_ENTERPRISE_CERTIFICATION.md");
  const report = readSource("docs/enterprise-certification-report.md");
  assert.match(chapter, /CERTIFIED WITH OBSERVATIONS/);
  assert.match(report, /# CERTIFIED WITH OBSERVATIONS/);
  assert.doesNotMatch(report, /\bFAIL\*\*/);
});

test("module certification table has no FAIL verdicts", () => {
  const report = readSource("docs/enterprise-certification-report.md");
  assert.match(report, /\|\s*Authentication\s*\|\s*\*\*PASS/);
  assert.match(report, /\|\s*Billing\s*\|\s*\*\*PASS/);
  assert.match(report, /\|\s*Database\s*\|\s*\*\*PASS/);
  assert.match(report, /\*\*FAIL modules:\*\* none/i);
  assert.doesNotMatch(report, /\|\s*[^*]+\s*\|\s*\*\*FAIL\*\*/);
});

test("paddle remains sole active billing webhook path", () => {
  assert.ok(pathExists("src/app/api/paddle/webhook/route.ts"));
  const stripeApi = join(rootDir, "src", "app", "api", "stripe");
  assert.equal(existsSync(stripeApi), false, "src/app/api/stripe must not exist");
});

test("product UI remains free of Foundation ModulePlaceholder", () => {
  const header = readSource("src/components/layout/page-header.tsx");
  assert.doesNotMatch(header, /ModulePlaceholder|Foundation Build v1/);
});

test("critical security posture docs and debt catalog exist", () => {
  assert.ok(pathExists("docs/enterprise-deployment.md"));
  assert.ok(pathExists("docs/enterprise-release-checklist.md"));
  assert.ok(pathExists("docs/paddle-billing.md"));
  assert.ok(pathExists("docs/technical-debt.md"));
  const debt = readSource("docs/technical-debt.md");
  assert.match(debt, /as never|typed.?write/i);
});

test("archived DNS notes no longer present Stripe webhook as authoritative without archive banner", () => {
  const dns = readSource("docs/dns-report.md");
  assert.match(dns, /ARCHIVED|Paddle|paddle\/webhook/i);
});

test("no active stripe webhook route files under src/app/api", () => {
  const apiRoot = join(rootDir, "src", "app", "api");
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "stripe") {
          assert.fail(`unexpected stripe API directory: ${full}`);
        }
        walk(full);
      }
    }
  }
  walk(apiRoot);
});
