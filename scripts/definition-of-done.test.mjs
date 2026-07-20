import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
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
];

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

test("all Build Bible V2 chapters 1–17 are Status Implemented", () => {
  for (const [chapter, relative] of CHAPTER_DOCS) {
    assert.ok(pathExists(relative), `missing chapter ${chapter} doc: ${relative}`);
    const doc = readSource(relative);
    assert.match(doc, /Status:\*\* Implemented/, `chapter ${chapter} must be Implemented`);
  }
});

test("always-apply rules exist for chapters 1–17", () => {
  const rules = [
    ".cursor/rules/build-bible-v2-ch1-foundation.mdc",
    ".cursor/rules/build-bible-v2-ch2-architecture.mdc",
    ".cursor/rules/build-bible-v2-ch3-next-typescript.mdc",
    ".cursor/rules/build-bible-v2-ch4-design-system.mdc",
    ".cursor/rules/build-bible-v2-ch5-database.mdc",
    ".cursor/rules/build-bible-v2-ch6-api.mdc",
    ".cursor/rules/build-bible-v2-ch7-performance.mdc",
    ".cursor/rules/build-bible-v2-ch8-seo.mdc",
    ".cursor/rules/build-bible-v2-ch9-i18n.mdc",
    ".cursor/rules/build-bible-v2-ch10-accessibility.mdc",
    ".cursor/rules/build-bible-v2-ch11-analytics.mdc",
    ".cursor/rules/build-bible-v2-ch12-paddle-billing.mdc",
    ".cursor/rules/build-bible-v2-ch13-regression.mdc",
    ".cursor/rules/build-bible-v2-ch14-production-readiness.mdc",
    ".cursor/rules/build-bible-v2-ch15-code-quality.mdc",
    ".cursor/rules/build-bible-v2-ch16-technical-debt.mdc",
    ".cursor/rules/build-bible-v2-ch17-definition-of-done.mdc",
  ];
  for (const relative of rules) {
    assert.ok(pathExists(relative), `missing rule ${relative}`);
    assert.match(readSource(relative), /alwaysApply:\s*true/);
  }
});

test("foundation ModulePlaceholder is removed from product UI", () => {
  const header = readSource("src/components/layout/page-header.tsx");
  assert.doesNotMatch(header, /ModulePlaceholder|Foundation Build v1/);
  const reportsNew = readSource("src/app/(dashboard)/reports/new/page.tsx");
  assert.doesNotMatch(reportsNew, /ModulePlaceholder/);
  assert.match(reportsNew, /EmptyState/);
});

test("src has no TODO FIXME HACK markers or console.log", () => {
  const files = walkTsFiles(join(rootDir, "src"));
  const markerHits = [];
  const logHits = [];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    if (/\/\/\s*(TODO|FIXME|HACK)\b|\/\*\s*(TODO|FIXME|HACK)\b/.test(source)) {
      markerHits.push(file.replace(rootDir + "\\", "").replace(rootDir + "/", ""));
    }
    if (/console\.log\s*\(/.test(source)) {
      logHits.push(file.replace(rootDir + "\\", "").replace(rootDir + "/", ""));
    }
  }
  assert.deepEqual(markerHits, [], `Forbidden markers:\n${markerHits.join("\n")}`);
  assert.deepEqual(logHits, [], `Forbidden console.log:\n${logHits.join("\n")}`);
});

test("critical production surfaces remain present", () => {
  for (const relative of [
    "src/app/api/paddle/webhook/route.ts",
    "src/app/api/cron/run/route.ts",
    "src/app/api/health/route.ts",
    "src/app/api/ready/route.ts",
    "src/app/(dashboard)/error.tsx",
    "src/app/(marketing)/error.tsx",
    "src/app/client-portal/error.tsx",
    "src/app/(dashboard)/not-found.tsx",
    "src/app/client-portal/(portal)/not-found.tsx",
    "src/lib/rbac/permissions.ts",
    "src/lib/billing/provider.ts",
    "docs/enterprise-release-checklist.md",
    "docs/paddle-billing.md",
    "docs/technical-debt.md",
  ]) {
    assert.ok(pathExists(relative), `missing ${relative}`);
  }
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /return "paddle"/);
});

test("DEV_FORCE_PLAN is ignored in production", () => {
  const override = readSource("src/lib/plans/dev-override.ts");
  assert.match(override, /NODE_ENV === "production"/);
});

test("DoD report records GO WITH CONDITIONS recommendation", () => {
  const report = readSource("docs/enterprise-dod-report.md");
  assert.match(report, /GO WITH CONDITIONS/);
  assert.doesNotMatch(report, /^# NO GO/m);
});
