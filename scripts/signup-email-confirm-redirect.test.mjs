/**
 * Production signup / email-confirmation redirect contracts.
 * Ensures confirmation links never intentionally target development hosts in production.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const authActions = () => readSource("src/lib/auth/actions.ts");
const redirects = () => readSource("src/lib/auth/redirects.ts");
const signupForm = () => readSource("src/components/auth/signup-form.tsx");
const safeRedirect = () => readSource("src/lib/auth/safe-redirect.ts");
const resetActions = () => readSource("src/lib/auth/reset-actions.ts");
const env = () => readSource("src/lib/env.ts");
const messages = () => readSource("src/lib/auth/messages.ts");

describe("production signup email confirmation redirect", () => {
  it("centralizes auth email redirect URLs on getAppUrl", () => {
    const source = redirects();
    assert.match(source, /getAppUrl/);
    assert.match(source, /export function getAuthCallbackUrl/);
    assert.match(source, /export function getPasswordResetRedirectUrl/);
    assert.match(source, /\/auth\/callback/);
    assert.match(source, /\/reset-password/);
    assert.match(source, /resolveSafeRedirectPath/);
    assert.doesNotMatch(source, /localhost:3000/);
    assert.doesNotMatch(source, /auroranexis\.com/);
  });

  it("production signup generateLink passes redirectTo from authoritative helper", () => {
    const source = authActions();
    assert.match(source, /getAuthCallbackUrl/);
    assert.match(source, /getAuthCallbackUrl\("\/login"\)/);
    assert.match(source, /options:\s*\{[\s\S]*redirectTo:\s*emailRedirectTo/);
    assert.match(source, /type:\s*"signup"/);
    assert.ok(
      source.includes("redirectTo: emailRedirectTo"),
      "generateLink must pass explicit redirectTo so Site URL is not the sole source",
    );
  });

  it("password reset uses the same redirect helper family", () => {
    assert.match(resetActions(), /getPasswordResetRedirectUrl\(\)/);
    assert.doesNotMatch(resetActions(), /redirectTo:\s*`\$\{getAppUrl\(\)\}/);
  });

  it("getAppUrl preserves localhost only as a non-production fallback", () => {
    const source = env();
    assert.match(source, /Missing required environment variable: NEXT_PUBLIC_APP_URL/);
    assert.match(source, /return "http:\/\/localhost:3000"/);
    assert.ok(
      source.indexOf('process.env.NODE_ENV === "production"') <
        source.indexOf('return "http://localhost:3000"'),
      "localhost fallback must be unreachable when NODE_ENV is production",
    );
  });

  it("rejects unsafe open redirects in callback next paths", () => {
    const source = safeRedirect();
    assert.match(source, /trimmed\.startsWith\("\/"\)/);
    assert.match(source, /trimmed\.startsWith\("\/\/"\)/);
    assert.match(source, /fallback/);
  });

  it("signup success requiring confirmation is not rendered as an error", () => {
    const actions = authActions();
    const form = signupForm();
    const copy = messages();

    assert.match(copy, /SIGNUP_CHECK_EMAIL/);
    assert.match(copy, /Check your email/);
    assert.match(actions, /success:\s*AUTH_MESSAGES\.SIGNUP_CHECK_EMAIL/);
    assert.doesNotMatch(actions, /error:\s*"Account created\. Confirm your email/);
    assert.match(form, /state\.success/);
    assert.match(form, /FormAlert variant="success"/);
    assert.match(form, /state\.error/);
    assert.match(form, /FormAlert variant="error"/);
  });
});
