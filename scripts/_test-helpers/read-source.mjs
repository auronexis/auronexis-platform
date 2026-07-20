/**
 * Shared helpers for Node source-contract tests (Build Bible + enterprise regression).
 * Prefer this over duplicating rootDir/readSource in every script.
 */

import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const helpersDir = dirname(fileURLToPath(import.meta.url));

export const rootDir = join(helpersDir, "..", "..");

export function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

export function pathExists(relativePath) {
  return existsSync(join(rootDir, relativePath));
}

export function assertFileExists(relativePath) {
  assert.ok(pathExists(relativePath), `Missing required file: ${relativePath}`);
}

export function assertDocAndRule({ docRelativePath, ruleRelativePath, statusImplemented = true }) {
  assertFileExists(docRelativePath);
  assertFileExists(ruleRelativePath);
  const doc = readSource(docRelativePath);
  if (statusImplemented) {
    assert.match(doc, /Status:\*\* Implemented/);
  }
  const rule = readSource(ruleRelativePath);
  assert.match(rule, /alwaysApply:\s*true/);
  return { doc, rule };
}

/** List API v1 route files relative to repo root. */
export function listApiV1RouteFiles() {
  const apiRoot = join(rootDir, "src", "app", "api", "v1");
  const results = [];

  function walk(dir, prefix) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const next = join(dir, entry.name);
      const rel = `${prefix}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(next, rel);
      } else if (entry.name === "route.ts") {
        results.push(`src/app/api/v1${rel}`);
      }
    }
  }

  walk(apiRoot, "");
  return results.sort();
}

/** Curated enterprise regression suites — order is fail-fast friendly. */
export const ENTERPRISE_REGRESSION_SUITE = [
  "scripts/build-bible-ch1.test.mjs",
  "scripts/build-bible-ch2.test.mjs",
  "scripts/build-bible-ch3.test.mjs",
  "scripts/build-bible-ch4.test.mjs",
  "scripts/build-bible-ch5.test.mjs",
  "scripts/build-bible-ch6.test.mjs",
  "scripts/build-bible-ch7.test.mjs",
  "scripts/build-bible-ch8.test.mjs",
  "scripts/build-bible-ch9.test.mjs",
  "scripts/build-bible-ch10.test.mjs",
  "scripts/build-bible-ch11.test.mjs",
  "scripts/build-bible-ch12.test.mjs",
  "scripts/build-bible-ch13.test.mjs",
  "scripts/build-bible-ch14.test.mjs",
  "scripts/build-bible-ch15.test.mjs",
  "scripts/build-bible-ch16.test.mjs",
  "scripts/build-bible-ch17.test.mjs",
  "scripts/build-bible-ch18.test.mjs",
  "scripts/build-bible-ch19.test.mjs",
  "scripts/build-bible-ch20.test.mjs",
  "scripts/production-readiness.test.mjs",
  "scripts/code-quality.test.mjs",
  "scripts/technical-debt.test.mjs",
  "scripts/definition-of-done.test.mjs",
  "scripts/enterprise-certification.test.mjs",
  "scripts/enterprise-release-approval.test.mjs",
  "scripts/enterprise-production-golive.test.mjs",
  "scripts/enterprise-regression-matrix.test.mjs",
  "scripts/paddle-billing.test.mjs",
  "scripts/paddle-sole-provider.test.mjs",
  "scripts/paddle-billing-v2.test.mjs",
  "scripts/technical-seo.test.mjs",
  "scripts/analytics-conversion.test.mjs",
  "scripts/workspace-currency.test.mjs",
  "scripts/openai-integration.test.mjs",
  "scripts/ai-copilot-safety.test.mjs",
];
