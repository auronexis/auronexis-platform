/**
 * Auth without CAPTCHA — regression contracts after removing unauthorized Turnstile.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pathExists, readSource } from "./_test-helpers/read-source.mjs";

const loginForm = () => readSource("src/components/auth/login-form.tsx");
const signupForm = () => readSource("src/components/auth/signup-form.tsx");
const forgotForm = () => readSource("src/components/auth/forgot-password-form.tsx");
const authActions = () => readSource("src/lib/auth/actions.ts");
const resetActions = () => readSource("src/lib/auth/reset-actions.ts");
const captureActions = () => readSource("src/lib/sales/capture-actions.ts");
const e2eBypass = () => readSource("src/lib/security/e2e-bypass.ts");
const envExample = () => readSource(".env.example");
const productionAudit = () => readSource("src/lib/env/production-audit.ts");

describe("auth without captcha / turnstile", () => {
  it("login and signup forms render no CAPTCHA or Turnstile component", () => {
    assert.doesNotMatch(loginForm(), /Turnstile|cf-turnstile|CAPTCHA|captcha/i);
    assert.doesNotMatch(signupForm(), /Turnstile|cf-turnstile|CAPTCHA|captcha/i);
    assert.doesNotMatch(forgotForm(), /Turnstile|cf-turnstile|CAPTCHA|captcha/i);
    assert.equal(pathExists("src/components/security/turnstile-field.tsx"), false);
    assert.equal(pathExists("src/lib/security/turnstile.ts"), false);
    assert.equal(pathExists("src/lib/security/turnstile-shared.ts"), false);
  });

  it("login and signup server actions do not require a CAPTCHA token", () => {
    const actions = authActions();
    assert.doesNotMatch(actions, /turnstile|Turnstile|cf-turnstile|CAPTCHA/i);
    assert.doesNotMatch(actions, /Security verification failed/);
    assert.match(actions, /signInWithPassword/);
    assert.match(actions, /createUser/);
    assert.match(actions, /checkLoginThrottle/);
    assert.match(actions, /checkSignupThrottle/);
  });

  it("missing Turnstile variables do not block authentication", () => {
    assert.doesNotMatch(envExample(), /NEXT_PUBLIC_TURNSTILE_SITE_KEY/);
    assert.doesNotMatch(envExample(), /TURNSTILE_SECRET_KEY/);
    assert.doesNotMatch(envExample(), /TURNSTILE_DISABLE/);
    assert.doesNotMatch(productionAudit(), /TURNSTILE/);
    assert.doesNotMatch(authActions(), /TURNSTILE|turnstile/);
  });

  it("invalid credentials remain rejected", () => {
    assert.match(authActions(), /Invalid email or password/);
    assert.match(authActions(), /loginSchema\.safeParse/);
    assert.match(authActions(), /signupSchema\.safeParse/);
  });

  it("production E2E bypass remains impossible", () => {
    assert.match(e2eBypass(), /NODE_ENV\s*===\s*"production"/);
    assert.match(e2eBypass(), /return false/);
    assert.ok(
      e2eBypass().indexOf('process.env.NODE_ENV === "production"') <
        e2eBypass().indexOf("E2E_DISABLE_RATE_LIMIT"),
      "production guard must run before E2E_DISABLE_RATE_LIMIT",
    );
    assert.doesNotMatch(e2eBypass(), /TURNSTILE_DISABLE/);
  });

  it("signup does not auto-confirm production users", () => {
    const actions = authActions();
    assert.match(actions, /email_confirm:\s*!isProduction/);
    assert.match(actions, /NODE_ENV\s*===\s*"production"/);
  });

  it("password reset remains protected by existing validation and throttling", () => {
    assert.doesNotMatch(resetActions(), /turnstile|Turnstile|CAPTCHA/i);
    assert.match(resetActions(), /checkPasswordResetThrottle/);
    assert.match(resetActions(), /emailSchema\.safeParse/);
    assert.match(resetActions(), /validatePasswordPolicy|resetPasswordSchema/);
  });

  it("no Turnstile environment variable is required", () => {
    assert.doesNotMatch(envExample(), /TURNSTILE/);
    assert.doesNotMatch(productionAudit(), /TURNSTILE|Turnstile|Cloudflare Turnstile/);
  });

  it("public capture forms no longer gate on Turnstile", () => {
    assert.doesNotMatch(captureActions(), /turnstile|Turnstile|CAPTCHA/i);
    assert.match(captureActions(), /checkPublicFormThrottle/);
  });

  it("other Security Fix Sprint protections remain active", () => {
    assert.match(authActions(), /email_confirm:\s*!isProduction/);
    assert.match(e2eBypass(), /Production must never activate E2E/);
    const csp = readSource("src/lib/security/csp.ts");
    assert.doesNotMatch(csp, /unsafe-eval/);
    assert.match(csp, /upgrade-insecure-requests/);
    const cronEnv = readSource("src/lib/env.ts");
    assert.match(cronEnv, /verifyCronAuthorization/);
  });
});
