/**
 * Auth Turnstile integration hotfix — source-contract regression tests.
 * Ensures login/signup cannot fail universally from client/server field mismatch,
 * production bypass stays impossible, and CSP allows Cloudflare Turnstile.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const shared = () => readSource("src/lib/security/turnstile-shared.ts");
const turnstile = () => readSource("src/lib/security/turnstile.ts");
const field = () => readSource("src/components/security/turnstile-field.tsx");
const loginForm = () => readSource("src/components/auth/login-form.tsx");
const signupForm = () => readSource("src/components/auth/signup-form.tsx");
const authActions = () => readSource("src/lib/auth/actions.ts");
const e2eBypass = () => readSource("src/lib/security/e2e-bypass.ts");
const csp = () => readSource("src/lib/security/csp.ts");

describe("auth turnstile production hotfix", () => {
  it("login and signup both render TurnstileField and submit the canonical token field", () => {
    assert.match(loginForm(), /TurnstileField/);
    assert.match(signupForm(), /TurnstileField/);
    assert.match(shared(), /TURNSTILE_RESPONSE_FIELD\s*=\s*"cf-turnstile-response"/);
    assert.match(field(), /name=\{TURNSTILE_RESPONSE_FIELD\}/);
    assert.match(turnstile(), /formData\.get\(TURNSTILE_RESPONSE_FIELD\)/);
  });

  it("login and signup gate submit until a verification token exists when the site key is present", () => {
    assert.match(loginForm(), /onTokenChange=\{setTurnstileToken\}/);
    assert.match(signupForm(), /onTokenChange=\{setTurnstileToken\}/);
    assert.match(loginForm(), /turnstileBlocksSubmit/);
    assert.match(signupForm(), /turnstileBlocksSubmit/);
    assert.match(loginForm(), /disabled=\{isPending \|\| turnstileBlocksSubmit\}/);
    assert.match(signupForm(), /disabled=\{isPending \|\| turnstileBlocksSubmit\}/);
  });

  it("server and client use the same token field and env var names", () => {
    assert.match(shared(), /NEXT_PUBLIC_TURNSTILE_SITE_KEY/);
    assert.match(shared(), /TURNSTILE_SECRET_KEY/);
    assert.match(field(), /readTurnstileSiteKeyFromEnv/);
    assert.match(turnstile(), /readTurnstileSecretKeyFromEnv/);
    assert.match(turnstile(), /TURNSTILE_RESPONSE_FIELD/);
    assert.doesNotMatch(field(), /TURNSTILE_SECRET_KEY/);
  });

  it("auth actions require Turnstile before credentials and use structured gate results", () => {
    const actions = authActions();
    assert.match(actions, /requireTurnstileFromForm/);
    assert.match(actions, /export async function signIn/);
    assert.match(actions, /export async function signUp/);

    const signInIdx = actions.indexOf("export async function signIn");
    const signUpIdx = actions.indexOf("export async function signUp");
    const signInBody = actions.slice(signInIdx, signUpIdx);
    const signUpBody = actions.slice(signUpIdx);

    assert.match(signInBody, /requireTurnstileFromForm\(formData\)/);
    assert.match(signUpBody, /requireTurnstileFromForm\(formData\)/);
    assert.match(signInBody, /signInWithPassword/);
    assert.ok(
      signInBody.indexOf("requireTurnstileFromForm") < signInBody.indexOf("signInWithPassword"),
      "login must verify Turnstile before signInWithPassword",
    );
    assert.match(signUpBody, /createUser/);
    assert.ok(
      signUpBody.indexOf("requireTurnstileFromForm") < signUpBody.indexOf("createUser"),
      "signup must verify Turnstile before createUser",
    );
  });

  it("missing configuration is a precise operational error, not a silent challenge failure", () => {
    assert.match(shared(), /TURNSTILE_MISCONFIGURED_ERROR/);
    assert.match(turnstile(), /reason:\s*"not_configured"/);
    assert.match(turnstile(), /TURNSTILE_MISCONFIGURED_ERROR/);
    assert.match(field(), /TURNSTILE_MISCONFIGURED_ERROR/);
    assert.match(authActions(), /turnstile\.error/);
    assert.doesNotMatch(
      authActions(),
      /isTurnstileConfigured\(\)\s*\|\|\s*process\.env\.NODE_ENV\s*===\s*"production"/,
    );
  });

  it("invalid or missing tokens are rejected when verification is enabled", () => {
    assert.match(turnstile(), /reason:\s*"missing_token"/);
    assert.match(turnstile(), /reason:\s*"invalid_token"/);
    assert.match(shared(), /TURNSTILE_RETRY_ERROR/);
    assert.match(turnstile(), /isTurnstileRequired/);
    assert.match(
      turnstile(),
      /isTurnstileConfigured\(\)\s*\|\|\s*process\.env\.NODE_ENV\s*===\s*"production"/,
    );
  });

  it("production E2E Turnstile bypass remains impossible", () => {
    assert.match(e2eBypass(), /NODE_ENV\s*===\s*"production"/);
    assert.match(e2eBypass(), /return false/);
    assert.ok(
      e2eBypass().indexOf('process.env.NODE_ENV === "production"') <
        e2eBypass().indexOf('TURNSTILE_DISABLE'),
      "production guard must run before TURNSTILE_DISABLE",
    );
  });

  it("CSP permits required Cloudflare Turnstile script, frame, and connect origins", () => {
    const policy = csp();
    assert.match(policy, /script-src[\s\S]*https:\/\/challenges\.cloudflare\.com/);
    assert.match(policy, /frame-src[\s\S]*https:\/\/challenges\.cloudflare\.com/);
    assert.match(policy, /connect-src[\s\S]*https:\/\/challenges\.cloudflare\.com/);
    assert.doesNotMatch(policy, /unsafe-eval/);
  });

  it("no Turnstile secret is exposed to the client bundle field component", () => {
    assert.doesNotMatch(field(), /TURNSTILE_SECRET_KEY/);
    assert.doesNotMatch(field(), /siteverify/);
    assert.doesNotMatch(loginForm(), /TURNSTILE_SECRET_KEY/);
    assert.doesNotMatch(signupForm(), /TURNSTILE_SECRET_KEY/);
  });

  it("login and signup cannot fail from field-name drift between forms and verifier", () => {
    const fieldNameMatches = shared().match(/TURNSTILE_RESPONSE_FIELD\s*=\s*"([^"]+)"/);
    assert.ok(fieldNameMatches);
    const fieldName = fieldNameMatches[1];
    assert.equal(fieldName, "cf-turnstile-response");
    assert.match(field(), new RegExp(`name=\\{TURNSTILE_RESPONSE_FIELD\\}`));
    assert.match(turnstile(), /formData\.get\(TURNSTILE_RESPONSE_FIELD\)/);
    assert.match(loginForm(), /TurnstileField/);
    assert.match(signupForm(), /TurnstileField/);
  });
});
