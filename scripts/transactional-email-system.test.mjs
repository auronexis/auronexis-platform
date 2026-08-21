/**
 * Transactional email system contracts (welcome, noreply, preferences, auth separation).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const company = () => readSource("src/lib/company/company-contact.ts");
const auth = () => readSource("src/lib/auth/actions.ts");
const welcome = () => readSource("src/lib/email/welcome.ts");
const transactional = () => readSource("src/lib/email/transactional.ts");
const welcomeTemplate = () => readSource("src/lib/email/templates/welcome.ts");
const preferences = () => readSource("src/lib/email/preferences.ts");
const profilePrefs = () => readSource("src/lib/profile/preferences.ts");
const categories = () => readSource("src/lib/email/categories.ts");
const resetActions = () => readSource("src/lib/auth/reset-actions.ts");
const redirects = () => readSource("src/lib/auth/redirects.ts");
const safeRedirect = () => readSource("src/lib/auth/safe-redirect.ts");
const smtp = () => readSource("src/lib/email/provider/smtp.ts");
const provider = () => readSource("src/lib/email/provider/index.ts");
const envEmail = () => readSource("src/lib/env/email.ts");
const envExample = () => readSource(".env.example");
const migration = () =>
  readSource("supabase/migrations/20250821100000_transactional_email_system.sql");
const salesNotify = () => readSource("src/lib/sales/notify.ts");
const enterpriseNotify = () => readSource("src/lib/enterprise/notify.ts");

describe("transactional email system", () => {
  it("1. signup provisions account and redirects to login success without confirmation UX", () => {
    const source = auth();
    assert.match(source, /email_confirm:\s*true/);
    assert.match(source, /redirect\("\/login\?signup=success"\)/);
    assert.doesNotMatch(source, /Check your email/);
    assert.doesNotMatch(source, /generateLink\(/);
  });

  it("2. welcome email is sent once via sendWelcomeEmailAfterSignup after profile create", () => {
    const source = auth();
    assert.match(source, /sendWelcomeEmailAfterSignup/);
    assert.match(source, /\.select\("id"\)/);
    assert.match(welcome(), /EMAIL_TEMPLATE_KEYS\.WELCOME/);
    assert.match(transactional(), /UNIQUE|23505|skipped/);
    assert.match(migration(), /UNIQUE \(user_id, template_key\)/);
  });

  it("3. welcome failure is caught and must not roll back the account", () => {
    const signupFn = auth().slice(auth().indexOf("export async function signUp"));
    assert.match(signupFn, /try \{[\s\S]*sendWelcomeEmailAfterSignup[\s\S]*\} catch \{/);
    const profileGate = signupFn.indexOf('return { error: "Unable to create user profile." }');
    const welcomeCall = signupFn.indexOf("sendWelcomeEmailAfterSignup({");
    assert.ok(profileGate >= 0 && welcomeCall > profileGate, "welcome runs only after successful profile create");
    assert.doesNotMatch(
      signupFn.slice(welcomeCall, welcomeCall + 900),
      /deleteUser|organizations"\)\.delete/,
    );
  });

  it("4. password reset stays enumeration-safe and uses Supabase redirect helper", () => {
    assert.match(resetActions(), /RESET_SENT|AUTH_MESSAGES\.RESET_SENT/);
    assert.match(resetActions(), /getPasswordResetRedirectUrl\(\)/);
    assert.match(resetActions(), /resetPasswordForEmail/);
    assert.doesNotMatch(resetActions(), /sendWelcomeEmailAfterSignup/);
    assert.doesNotMatch(resetActions(), /sendTransactionalEmail/);
  });

  it("5. sales@ is never the transactional From for auth/account system mail", () => {
    assert.match(company(), /noReplyEmail: "noreply@auroranexis\.com"/);
    assert.match(company(), /salesEmail: "sales@auroranexis\.com"/);
    assert.match(transactional(), /getTransactionalFromEmail/);
    assert.match(transactional(), /getPlatformNoReplySender/);
    assert.doesNotMatch(welcome(), /sales@/);
    assert.doesNotMatch(welcomeTemplate(), /sales@/);
    assert.match(salesNotify(), /getDefaultFromEmail\(\)/);
    assert.match(salesNotify(), /getInboxEmail/);
    assert.match(enterpriseNotify(), /to:\s*SALES_EMAIL/);
  });

  it("6. welcome template has no auth secrets and uses a branded CTA label", () => {
    const template = welcomeTemplate();
    assert.match(template, /WELCOME_EMAIL_SUBJECT/);
    assert.match(template, /Sign in to/);
    assert.match(template, /buildEmailCtaButton/);
    assert.doesNotMatch(template, /ConfirmationURL|action_link|recovery_token|access_token/i);
    assert.doesNotMatch(template, /localhost/);
  });

  it("7. production redirects do not hardcode localhost in auth helpers", () => {
    assert.doesNotMatch(redirects(), /localhost:3000/);
    assert.match(redirects(), /getAppUrl/);
    assert.match(welcome(), /getAppUrl\(\)/);
    assert.match(welcome(), /\/login/);
  });

  it("8. open redirects are rejected for auth next paths", () => {
    const source = safeRedirect();
    assert.match(source, /trimmed\.startsWith\("\/"\)/);
    assert.match(source, /trimmed\.startsWith\("\/\/"\)/);
  });

  it("9. marketing opt-out does not disable transactional categories", () => {
    const prefs = preferences();
    const cats = categories();
    assert.match(cats, /AUTH|auth/);
    assert.match(cats, /ACCOUNT|account/);
    assert.match(cats, /BILLING_SYSTEM|billing_system/);
    assert.match(prefs, /isTransactionalRequiredCategory/);
    assert.match(prefs, /transactionalRequired: true/);
    assert.match(prefs, /marketingUnsubscribedAt/);
    assert.match(
      prefs,
      /category === "product_updates"[\s\S]*marketingUnsubscribedAt[\s\S]*return isTransactionalRequiredCategory/,
    );
  });

  it("10. marketing preferences default to opt-in false (no auto-subscribe)", () => {
    assert.match(preferences(), /productUpdates: false/);
    assert.match(preferences(), /newsletter: false/);
    assert.match(preferences(), /promotions: false/);
    assert.match(profilePrefs(), /productUpdates: false/);
    assert.match(profilePrefs(), /newsletter: false/);
    assert.match(migration(), /product_updates BOOLEAN NOT NULL DEFAULT FALSE/);
    assert.match(migration(), /newsletter BOOLEAN NOT NULL DEFAULT FALSE/);
    assert.match(migration(), /promotions BOOLEAN NOT NULL DEFAULT FALSE/);
  });

  it("11. consent / preference foundation exists without marketing send pipeline", () => {
    assert.match(preferences(), /canSendEmailForPreferences/);
    assert.match(preferences(), /getUserEmailPreferences/);
    assert.match(migration(), /user_email_preferences/);
    assert.doesNotMatch(welcome(), /newsletter|promotions|product_updates/);
    assert.doesNotMatch(auth(), /newsletter|promotions|productUpdates/);
  });

  it("12. delivery architecture uses claim → sendEmail facade → finalize (no second queue)", () => {
    assert.match(transactional(), /claimDelivery/);
    assert.match(transactional(), /sendEmail\(/);
    assert.match(transactional(), /finalizeDelivery/);
    assert.match(provider(), /export async function sendEmail/);
    assert.doesNotMatch(welcome(), /nodemailer/i);
    assert.doesNotMatch(auth(), /nodemailer/i);
    assert.doesNotMatch(transactional(), /enqueue|queue_jobs/);
  });

  it("13. idempotency ledger unique on user_id + template_key", () => {
    assert.match(migration(), /transactional_email_deliveries/);
    assert.match(migration(), /UNIQUE \(user_id, template_key\)/);
    assert.match(transactional(), /error\.code === "23505"/);
  });

  it("14. SMTP STRATO settings documented; credentials never committed", () => {
    const example = envExample();
    assert.match(example, /^SMTP_HOST=smtp\.strato\.de$/m);
    assert.match(example, /^SMTP_PORT=465$/m);
    assert.match(example, /^SMTP_SECURE=true$/m);
    assert.match(example, /^SMTP_PASSWORD=$/m);
    assert.match(example, /noreply@auroranexis\.com/);
    assert.doesNotMatch(example, /SMTP_PASSWORD=.+/);
    assert.match(smtp(), /port === 465/);
    assert.match(smtp(), /secure: config\.secure/);
  });

  it("15. canonical noreply sender and EMAIL_FROM guidance", () => {
    assert.match(company(), /noreply@auroranexis\.com/);
    assert.doesNotMatch(company(), /no-reply@auroranexis\.com/);
    assert.match(envEmail(), /noReplyEmail/);
    assert.match(envExample(), /EMAIL_FROM=Auroranexis <noreply@auroranexis\.com>/);
  });

  it("16. welcome subject and support contact present; no giant raw token URLs in HTML CTA", () => {
    const template = welcomeTemplate();
    assert.match(template, /Welcome to/);
    assert.match(template, /supportEmail/);
    assert.match(template, /buildEmailCtaButton\(`Sign in to/);
  });

  it("17. failures are observable without logging recipient PII or passwords", () => {
    const tx = transactional();
    assert.match(tx, /console\.error\("\[email\] transactional/);
    assert.match(tx, /template: input\.templateKey/);
    assert.doesNotMatch(tx, /console\.error\([^\n]*\bto\b/);
    assert.doesNotMatch(tx, /console\.error\([\s\S]{0,80}recipientEmail/);
    assert.doesNotMatch(smtp(), /console\.(log|debug|error|warn)\([\s\S]*password/i);
    assert.match(auth(), /welcome after signup failed \(account retained\)/);
  });

  it("18. source contracts cover auth+email separation for operator SMTP", () => {
    assert.match(readSource("docs/email-system.md"), /Supabase Auth SMTP/);
    assert.match(readSource("docs/email-system.md"), /App `sendEmail\(\)`/);
    assert.match(readSource("docs/auth/password-reset.md"), /Confirm email: OFF/);
    assert.match(readSource("docs/auth/password-reset.md"), /noreply@auroranexis\.com/);
  });
});
