/**
 * zod 4 migration (GHSA-mrhx-c7xc-m3w5): the app uses zod >= 4.6.6 through one shared
 * entry point that keeps short "Required" messages for missing values.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/zod-v4-migration.test.mjs
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const { z } = await import("@/lib/validation/zod");

describe("zod 4", () => {
  it("installed version is patched (>= 4.6.6)", () => {
    const { version } = JSON.parse(readFileSync("node_modules/zod/package.json", "utf8"));
    const [major, minor, patch] = version.split(".").map(Number);
    assert.ok(major > 4 || (major === 4 && (minor > 6 || (minor === 6 && patch >= 6))), version);
  });

  it("all app code imports zod through the shared entry point", () => {
    const direct = execSync(`grep -rln 'from "zod"' src || true`, { encoding: "utf8" })
      .split("\n")
      .filter((line) => line && line !== "src/lib/validation/zod.ts");
    assert.deepEqual(direct, []);
  });

  it("missing values read 'Required'; custom messages still win", () => {
    const schema = z.object({ name: z.string().min(1, "Name is required."), email: z.string().email() });
    const missing = schema.safeParse({ name: undefined, email: null });
    assert.equal(missing.success, false);
    const messages = Object.fromEntries(missing.error.issues.map((issue) => [issue.path[0], issue.message]));
    assert.equal(messages.name, "Required");
    assert.equal(messages.email, "Required");
    const empty = schema.safeParse({ name: "", email: "x@example.com" });
    assert.equal(empty.error.issues[0].message, "Name is required.");
  });

  it("record schemas take a key type (zod 4 API)", () => {
    const record = z.record(z.string(), z.unknown());
    assert.equal(record.safeParse({ a: 1 }).success, true);
  });

  it("logo URLs accept only http(s) — not javascript: or data: (hardened during migration)", () => {
    const url = z.url({ protocol: /^https?$/ });
    assert.equal(url.safeParse("https://example.com/logo.png").success, true);
    for (const bad of ["javascript:alert(1)", "data:text/html;base64,xx", "ftp://example.com/x"]) {
      assert.equal(url.safeParse(bad).success, false, bad);
    }
  });
});
