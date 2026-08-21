/**
 * Production signup redirect contracts (email confirmation intentionally disabled).
 * Ensures signup never targets development hosts and never shows false confirm-email UX.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const authActions = () => readSource("src/lib/auth/actions.ts");
const redirects = () => readSource("src/lib/auth/redirects.ts");
const signupForm = () => readSource("src/components/auth/signup-form.tsx");
const loginPage = () => readSource("src/app/(auth)/login/page.tsx");
const safeRedirect = () => readSource("src/lib/auth/safe-redirect.ts");
const resetActions = () => readSource("src/lib/auth/reset-actions.ts");
const callback = () => readSource("src/app/auth/callback/route.ts");
const env = () => readSource("src/lib/env.ts");
const messages = () => readSource("src/lib/auth/messages.ts");

describe("production signup without email confirmation UX", () => {
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

  it("signup confirms the auth user and does not send confirmation links", () => {
    const source = authActions();
    assert.match(source, /email_confirm:\s*true/);
    assert.doesNotMatch(source, /generateLink\(/);
    assert.doesNotMatch(source, /SIGNUP_CHECK_EMAIL/);
    assert.doesNotMatch(source, /Check your email/);
    assert.doesNotMatch(source, /Confirm your Auroranexis account/);
    assert.doesNotMatch(source, /action_link/);
    // Welcome is account mail via facade — not confirmation / not Nodemailer in the action.
    assert.match(source, /sendWelcomeEmailAfterSignup/);
    assert.doesNotMatch(source, /nodemailer/i);
    assert.doesNotMatch(source, /sendEmail\(/);
  });

  it("successful signup redirects to login without auto sign-in", () => {
    const source = authActions();
    assert.match(source, /redirect\("\/login\?signup=success"\)/);
    assert.doesNotMatch(source, /redirect\("\/dashboard"\)/);
    // signInWithPassword remains for login; signup must not call it after createUser.
    const signupFn = source.slice(source.indexOf("export async function signUp"));
    assert.doesNotMatch(signupFn, /signInWithPassword/);
  });

  it("login page shows neutral signup success copy", () => {
    const copy = messages();
    const page = loginPage();
    assert.match(copy, /SIGNUP_SUCCESS/);
    assert.match(copy, /Account created successfully\. You can now sign in\./);
    assert.doesNotMatch(copy, /SIGNUP_CHECK_EMAIL/);
    assert.doesNotMatch(copy, /Check your email/);
    assert.match(page, /signup === "success"/);
    assert.match(page, /AUTH_MESSAGES\.SIGNUP_SUCCESS/);
  });

  it("password reset uses the same redirect helper family", () => {
    assert.match(resetActions(), /getPasswordResetRedirectUrl\(\)/);
    assert.doesNotMatch(resetActions(), /redirectTo:\s*`\$\{getAppUrl\(\)\}/);
  });

  it("auth callback exchanges code and redirects via getAppUrl", () => {
    const source = callback();
    assert.match(source, /exchangeCodeForSession/);
    assert.match(source, /getAppUrl/);
    assert.match(source, /resolveSafeRedirectPath/);
    assert.doesNotMatch(source, /localhost/);
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

  it("signup form still surfaces action errors without confirm-email success copy", () => {
    const form = signupForm();
    assert.match(form, /state\.error/);
    assert.match(form, /FormAlert variant="error"/);
    assert.doesNotMatch(form, /Check your email/);
  });
});
