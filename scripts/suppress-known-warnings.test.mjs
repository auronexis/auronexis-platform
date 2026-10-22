/**
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/suppress-known-warnings.test.mjs
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { readSource, rootDir } from "./_test-helpers/read-source.mjs";

function run(code) {
  return spawnSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", code], {
    cwd: rootDir,
    encoding: "utf8",
  });
}

test("url.parse deprecation (DEP0169) is silenced, other warnings still print", () => {
  const code = `
    const { suppressKnownNodeWarnings } = await import("./src/lib/observability/suppress-known-warnings.ts");
    suppressKnownNodeWarnings();
    // Node 24 emits DEP0169 for url.parse() through process.emitWarning exactly like this.
    process.emitWarning("\`url.parse()\` behavior is not standardized", "DeprecationWarning", "DEP0169");
    process.emitWarning("url.parse via options", { type: "DeprecationWarning", code: "DEP0169" });
    process.emitWarning("still visible", { type: "DeprecationWarning", code: "DEP9999" });
  `;
  const out = run(code);
  assert.equal(out.status, 0, out.stderr);
  assert.doesNotMatch(out.stderr, /DEP0169/);
  assert.match(out.stderr, /DEP9999/);
});

test("without the filter Node does print DEP0169 (guards the test itself)", () => {
  const out = run(`process.emitWarning("x", "DeprecationWarning", "DEP0169");`);
  assert.match(out.stderr, /DEP0169/);
});

test("instrumentation installs the filter before Sentry in the Node runtime", () => {
  const source = readSource("src/instrumentation.ts");
  assert.ok(source.indexOf("suppressKnownNodeWarnings()") < source.indexOf('import("../sentry.server.config")'));
});
