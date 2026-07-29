import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("transactional email routes through server-only provider with Resend default", () => {
  const provider = readSource("src/lib/email/provider/index.ts");
  const env = readSource("src/lib/env/email.ts");

  assert.match(provider, /import "server-only"/);
  assert.match(provider, /case "resend"/);
  assert.match(env, /return "resend"/);
  assert.match(env, /RESEND_API_KEY/);
  assert.match(env, /EMAIL_FROM/);
  assert.match(env, /RESEND_FROM_EMAIL/);
  assert.match(env, /noReplyEmail/);
});

test("lead notification recipient is fixed inbox mapping — never client-controlled", () => {
  const notify = readSource("src/lib/sales/notify.ts");
  const stages = readSource("src/lib/sales/pipeline-stages.ts");
  const capture = readSource("src/lib/sales/capture-actions.ts");

  assert.match(notify, /const to = getInboxEmail\(input\.inboxKey\)/);
  assert.match(notify, /to,/);
  assert.match(notify, /replyTo: input\.contactEmail/);
  assert.doesNotMatch(notify, /to: input\./);
  assert.match(stages, /key: "info"[\s\S]*email: INFO_EMAIL/);
  assert.match(stages, /key: "sales"[\s\S]*email: SALES_EMAIL/);
  assert.match(stages, /key: "support"[\s\S]*email: SUPPORT_EMAIL/);
  assert.match(stages, /key: "security"[\s\S]*email: SECURITY_EMAIL/);

  assert.match(capture, /source: "contact"[\s\S]*inboxKey: "info"/);
  assert.match(capture, /source: "pilot"[\s\S]*inboxKey: "sales"/);
  assert.match(capture, /source: "demo"[\s\S]*inboxKey: "sales"/);
  assert.match(capture, /source: "newsletter"[\s\S]*inboxKey: "info"/);
  assert.match(capture, /source: "referral"[\s\S]*inboxKey: "sales"/);
  assert.match(capture, /checkPublicFormThrottle/);
  assert.match(capture, /success: true/);
});

test("enterprise request persists then notifies sales@ — recipient not client-controlled", () => {
  const actions = readSource("src/lib/enterprise/actions.ts");
  const notify = readSource("src/lib/enterprise/notify.ts");
  const company = readSource("src/lib/company/company-contact.ts");

  assert.match(actions, /from\("enterprise_requests"\)/);
  assert.match(actions, /sendEnterpriseRequestNotificationEmail/);
  assert.match(notify, /to:\s*SALES_EMAIL/);
  assert.match(notify, /replyTo:\s*input\.contactEmail/);
  assert.doesNotMatch(notify, /to:\s*input\./);
  assert.match(company, /salesEmail: "sales@auroranexis\.com"/);
  // Durable success is DB insert; email is best-effort after persistence.
  assert.match(actions, /recordEnterpriseActivitySafe/);
});

test("production signup confirmation sends action link via configured provider", () => {
  const auth = readSource("src/lib/auth/actions.ts");
  assert.match(auth, /generateLink\(/);
  assert.match(auth, /action_link/);
  assert.match(auth, /sendEmail\(/);
  assert.match(auth, /Confirm your Auroranexis account/);
  assert.match(auth, /isEmailConfigured\(/);
  assert.doesNotMatch(auth, /\.catch\(\(\) => undefined\)/);
});

test("company contact registry is the hard-coded destination source of truth", () => {
  const company = readSource("src/lib/company/company-contact.ts");
  for (const address of [
    "support@auroranexis.com",
    "legal@auroranexis.com",
    "sales@auroranexis.com",
    "security@auroranexis.com",
    "info@auroranexis.com",
    "privacy@auroranexis.com",
    "partners@auroranexis.com",
    "press@auroranexis.com",
    "no-reply@auroranexis.com",
  ]) {
    assert.match(company, new RegExp(address.replace(".", "\\.")));
  }
});
