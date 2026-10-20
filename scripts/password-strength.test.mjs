/**
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/password-strength.test.mjs
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const { checkNewPassword, isPasswordBreached, PASSWORD_BREACHED_MESSAGE } = await import(
  "../src/lib/auth/password-strength.ts"
);
const { AUTH_MESSAGES } = await import("../src/lib/auth/messages.ts");

function rangeResponseFor(password, count = 42) {
  const sha1 = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    const body = `0000000000000000000000000000000000A:0\r\n${sha1.slice(5)}:${count}\r\nFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF:3`;
    return new Response(body, { status: 200 });
  };
  return { fetchImpl, calls, prefix: sha1.slice(0, 5) };
}

test("weak passwords are rejected before any network call", async () => {
  let called = false;
  const result = await checkNewPassword("short1A", {
    fetchImpl: async () => {
      called = true;
      return new Response("", { status: 200 });
    },
  });
  assert.equal(result, AUTH_MESSAGES.PASSWORD_TOO_WEAK);
  assert.equal(called, false);
});

test("breached password is rejected and only the 5-char hash prefix is sent", async () => {
  const password = "Password12345";
  const { fetchImpl, calls, prefix } = rangeResponseFor(password);
  const result = await checkNewPassword(password, { fetchImpl });
  assert.equal(result, PASSWORD_BREACHED_MESSAGE);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].endsWith(`/range/${prefix}`));
  assert.ok(!calls[0].includes(password));
});

test("padding entries with count 0 do not count as breached", async () => {
  const password = "Unique-Strong-Pass-2026";
  const { fetchImpl } = rangeResponseFor(password, 0);
  assert.equal(await isPasswordBreached(password, { fetchImpl }), false);
});

test("strong, unbreached password passes", async () => {
  const fetchImpl = async () => new Response("ABCDEF0123456789ABCDEF0123456789ABC:5", { status: 200 });
  assert.equal(await checkNewPassword("Correct-Horse-Battery-9", { fetchImpl }), null);
});

test("breach API outage fails open", async () => {
  const fetchImpl = async () => {
    throw new Error("network down");
  };
  assert.equal(await checkNewPassword("Correct-Horse-Battery-9", { fetchImpl }), null);
  const status500 = async () => new Response("", { status: 500 });
  assert.equal(await checkNewPassword("Correct-Horse-Battery-9", { fetchImpl: status500 }), null);
});

test("every new-password server action runs checkNewPassword", () => {
  for (const file of [
    "src/lib/auth/actions.ts",
    "src/lib/auth/reset-actions.ts",
    "src/lib/profile/actions.ts",
    "src/lib/team/actions.ts",
    "src/lib/client-portal/actions.ts",
  ]) {
    assert.match(readSource(file), /await checkNewPassword\(parsed\.data\.password\)/, file);
  }
});
