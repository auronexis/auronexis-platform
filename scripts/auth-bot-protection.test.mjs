/**
 * Bot protection (Cloudflare Turnstile) on sign-in, registration, password reset, client
 * portal sign-in and public forms — without ever locking users out when keys are missing.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/auth-bot-protection.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const FORMS = {
  "src/components/auth/login-form.tsx": "login",
  "src/components/auth/signup-form.tsx": "signup",
  "src/components/auth/forgot-password-form.tsx": "password_reset",
  "src/components/client-portal/portal-login-form.tsx": "portal_login",
  "src/components/marketing/contact-form.tsx": "contact",
  "src/components/marketing/demo-booking-form.tsx": "demo",
  "src/components/marketing/pilot-application-form.tsx": "pilot",
  "src/components/marketing/referral-lead-form.tsx": "referral",
  "src/components/marketing/newsletter-signup-form.tsx": "newsletter",
};

describe("bot protection", () => {
  it("every public auth and lead form renders the Turnstile field and resets it after each submit", () => {
    for (const [path, action] of Object.entries(FORMS)) {
      const source = readSource(path);
      assert.match(source, new RegExp(`<TurnstileField action="${action}" resetKey=\\{state\\}`), path);
    }
  });

  it("server actions check the bot token before rate limits and credentials", () => {
    const auth = readSource("src/lib/auth/actions.ts");
    assert.ok(auth.indexOf("requireTurnstileFromForm(formData)") < auth.indexOf("checkLoginThrottle(parsed"));
    assert.ok(auth.lastIndexOf("requireTurnstileFromForm(formData)") < auth.indexOf("checkSignupThrottle(parsed"));
    assert.ok(auth.indexOf("checkLoginThrottle(parsed") < auth.indexOf("signInWithPassword"));
    const reset = readSource("src/lib/auth/reset-actions.ts");
    assert.ok(reset.indexOf("requireTurnstileFromForm(formData)") < reset.indexOf("checkPasswordResetThrottle(parsed"));
    const portal = readSource("src/lib/client-portal/actions.ts");
    assert.ok(portal.indexOf("requireTurnstileFromForm(formData)") < portal.indexOf("checkPortalLoginThrottle(parsed"));
    const capture = readSource("src/lib/sales/capture-actions.ts");
    assert.match(capture, /async function validatePublicSubmission\([\s\S]*?requireTurnstileFromForm\(formData\)[\s\S]*?checkPublicFormThrottle/);
    assert.equal((capture.match(/validatePublicSubmission\(parsed\.data\.email, "\w+", formData\)/g) ?? []).length, 5);
  });

  it("missing keys never lock users out", () => {
    const server = readSource("src/lib/security/turnstile.ts");
    assert.match(server, /if \(!isTurnstileEnforced\(\)\) \{\s*return \{ ok: true \};/);
    assert.match(server, /Boolean\(getTurnstileSiteKey\(\) && getTurnstileSecretKey\(\)\)/);
    assert.doesNotMatch(server, /NODE_ENV === "production"/);
    const field = readSource("src/components/security/turnstile-field.tsx");
    assert.match(field, /if \(!siteKey\) \{\s*return null;/);
  });

  it("the public site key is read with a literal env access so Next.js inlines it", () => {
    const shared = readSource("src/lib/security/turnstile-shared.ts");
    assert.match(shared, /process\.env\.NEXT_PUBLIC_TURNSTILE_SITE_KEY/);
    assert.doesNotMatch(shared, /process\.env\[/);
  });

  it("missing or oversized tokens are rejected; Cloudflare outages fall back to rate limits", () => {
    const server = readSource("src/lib/security/turnstile.ts");
    assert.match(server, /token\.length === 0 \|\| token\.length > MAX_TOKEN_LENGTH/);
    assert.match(server, /outcome === "unreachable"[\s\S]*?return \{ ok: true \}/);
    assert.match(server, /AbortSignal\.timeout\(VERIFY_TIMEOUT_MS\)/);
  });

  it("Cloudflare is disclosed in the privacy policy and sub-processor list", () => {
    assert.match(readSource("src/lib/company/subprocessors-inventory.ts"), /provider: "Cloudflare Turnstile"/);
    assert.match(readSource("src/lib/company/legal-content.ts"), /heading: "Bot protection"/);
  });

  it("only one token field per form (Cloudflare's own response field is disabled)", () => {
    assert.match(readSource("src/components/security/turnstile-field.tsx"), /"response-field": false/);
  });

  it("CSP allows the Turnstile script and frame", () => {
    const csp = readSource("src/lib/security/csp.ts");
    assert.match(csp, /frame-src https:\/\/challenges\.cloudflare\.com/);
  });

  it("production E2E bypass remains impossible", () => {
    const bypass = readSource("src/lib/security/e2e-bypass.ts");
    assert.match(bypass, /NODE_ENV\s*===\s*"production"/);
  });
});
