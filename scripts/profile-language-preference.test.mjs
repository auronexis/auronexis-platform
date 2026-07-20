/**
 * Profile language preference must not pretend UI multilingual switching exists.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pathExists, readSource } from "./_test-helpers/read-source.mjs";

describe("profile language preference honesty", () => {
  it("does not ship a complete multilingual UI stack", () => {
    assert.equal(pathExists("src/lib/i18n/messages.ts"), true);
    const messages = readSource("src/lib/i18n/messages.ts");
    assert.match(messages, /scaffold for future language packs/i);
    assert.equal(pathExists("package.json"), true);
    const pkg = readSource("package.json");
    assert.doesNotMatch(pkg, /"next-intl"/);
    assert.doesNotMatch(pkg, /"next-i18next"/);
    assert.doesNotMatch(pkg, /"react-i18next"/);
    assert.equal(pathExists("src/locales"), false);
    assert.equal(pathExists("messages"), false);
  });

  it("disables the profile language selector without a fake save path", () => {
    const center = readSource("src/components/profile/account-center.tsx");
    assert.match(center, /Multiple languages will be available in a future release/);
    assert.match(center, /Coming soon/);
    assert.match(center, /disabled/);
    assert.match(center, /language:\s*"en"/);
    assert.doesNotMatch(
      center,
      /onChange=\{\(value\)\s*=>\s*setRegionalDraft\(\(current\)\s*=>\s*\(\{\s*\.\.\.current,\s*language:\s*value/,
    );
  });

  it("regional dirty detection ignores unavailable UI language switching", () => {
    const center = readSource("src/components/profile/account-center.tsx");
    assert.match(center, /ignore it for dirty detection/);
    assert.doesNotMatch(
      center,
      /a\.language\s*===\s*b\.language/,
    );
  });
});
