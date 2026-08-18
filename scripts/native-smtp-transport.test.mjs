import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("EMAIL_PROVIDER=smtp selects native SMTP through sendEmail facade", () => {
  const provider = readSource("src/lib/email/provider/index.ts");
  const env = readSource("src/lib/env/email.ts");
  const smtp = readSource("src/lib/email/provider/smtp.ts");

  assert.match(provider, /export async function sendEmail/);
  assert.match(provider, /case "smtp":\s*return sendViaSmtp\(message\)/);
  assert.match(env, /EmailProviderId = "resend" \| "ses" \| "smtp"/);
  assert.match(env, /EMAIL_PROVIDER.*toLowerCase/);
  assert.match(smtp, /nodemailer\.createTransport/);
  assert.match(smtp, /transporter\.sendMail/);
  assert.doesNotMatch(provider, /nodemailer/i);
  assert.doesNotMatch(smtp, /SMTP_RELAY_URL/);
  assert.doesNotMatch(smtp, /fetch\(/);
});

test("port 465 and SMTP_SECURE=true produce secure SMTP transport without weakening TLS", () => {
  const smtp = readSource("src/lib/email/provider/smtp.ts");

  assert.match(smtp, /function resolveSmtpSecure\(port: number\): boolean/);
  assert.match(smtp, /if \(port === 465\) \{\s*return true;/);
  assert.match(smtp, /SMTP_SECURE/);
  assert.match(smtp, /secure: config\.secure/);
  assert.doesNotMatch(smtp, /rejectUnauthorized\s*:\s*false/);
  assert.doesNotMatch(smtp, /tls:\s*\{/);
  assert.doesNotMatch(smtp, /ignoreTLS|requireTLS:\s*false/i);
});

test("SMTP auth uses SMTP_USER and SMTP_PASSWORD", () => {
  const smtp = readSource("src/lib/email/provider/smtp.ts");

  assert.match(smtp, /SMTP_USER/);
  assert.match(smtp, /SMTP_PASSWORD/);
  assert.match(smtp, /auth:\s*\{\s*user: config\.user,\s*pass: config\.password,/);
  assert.match(smtp, /user = process\.env\.SMTP_USER/);
  assert.match(smtp, /password = process\.env\.SMTP_PASSWORD/);
});

test("SMTP_RELAY_URL is not required for smtp configuration or transport", () => {
  const env = readSource("src/lib/env/email.ts");
  const smtp = readSource("src/lib/email/provider/smtp.ts");
  const example = readSource(".env.example");

  assert.doesNotMatch(env, /SMTP_RELAY_URL/);
  assert.doesNotMatch(smtp, /SMTP_RELAY_URL/);
  assert.doesNotMatch(smtp, /SMTP_RELAY_TOKEN/);
  assert.doesNotMatch(example, /SMTP_RELAY_URL/);
  assert.match(env, /case "smtp":[\s\S]*SMTP_HOST[\s\S]*SMTP_PORT[\s\S]*SMTP_USER[\s\S]*SMTP_PASSWORD[\s\S]*SMTP_FROM/);
});

test("customer email is never SMTP From; Reply-To remains visitor when safe", () => {
  const notify = readSource("src/lib/sales/notify.ts");
  const enterprise = readSource("src/lib/enterprise/notify.ts");
  const env = readSource("src/lib/env/email.ts");
  const addresses = readSource("src/lib/email/addresses.ts");

  assert.match(notify, /const from = getDefaultFromEmail\(\)/);
  assert.match(notify, /safeReplyToAddress\(input\.contactEmail\)/);
  assert.doesNotMatch(notify, /from:\s*input\./);
  assert.match(enterprise, /const from = getDefaultFromEmail\(\)/);
  assert.match(enterprise, /safeReplyToAddress\(input\.contactEmail\)/);
  assert.doesNotMatch(enterprise, /from:\s*input\./);
  assert.match(env, /getEmailProviderId\(\) === "smtp"/);
  assert.match(env, /process\.env\.SMTP_FROM/);
  assert.match(addresses, /Never use as SMTP From/);
  assert.match(addresses, /export function safeReplyToAddress/);
});

test("canonical recipients stay inbox-mapped — SMTP_USER is sender not recipient", () => {
  const notify = readSource("src/lib/sales/notify.ts");
  const enterprise = readSource("src/lib/enterprise/notify.ts");
  const stages = readSource("src/lib/sales/pipeline-stages.ts");
  const company = readSource("src/lib/company/company-contact.ts");
  const smtp = readSource("src/lib/email/provider/smtp.ts");
  const capture = readSource("src/lib/sales/capture-actions.ts");

  assert.match(company, /salesEmail: "sales@auroranexis\.com"/);
  assert.match(company, /supportEmail: "support@auroranexis\.com"/);
  assert.match(company, /infoEmail: "info@auroranexis\.com"/);
  assert.match(company, /securityEmail: "security@auroranexis\.com"/);
  assert.match(notify, /const to = getInboxEmail\(input\.inboxKey\)/);
  assert.doesNotMatch(notify, /to: input\./);
  assert.match(enterprise, /to:\s*SALES_EMAIL/);
  assert.match(stages, /key: "sales"[\s\S]*email: SALES_EMAIL/);
  assert.match(stages, /key: "support"[\s\S]*email: SUPPORT_EMAIL/);
  assert.match(stages, /key: "info"[\s\S]*email: INFO_EMAIL/);
  assert.match(stages, /key: "security"[\s\S]*email: SECURITY_EMAIL/);
  assert.match(capture, /source: "contact"[\s\S]*inboxKey: "sales"/);
  assert.match(capture, /source: "newsletter"[\s\S]*inboxKey: "info"/);
  assert.match(smtp, /to: message\.to/);
  assert.doesNotMatch(smtp, /to:\s*config\.user/);
  assert.doesNotMatch(smtp, /to:\s*process\.env\.SMTP_USER/);
});

test("SMTP password cannot appear in logs or returned errors", () => {
  const smtp = readSource("src/lib/email/provider/smtp.ts");
  const notify = readSource("src/lib/sales/notify.ts");
  const enterprise = readSource("src/lib/enterprise/notify.ts");

  assert.match(smtp, /function sanitizeSmtpOperationalError/);
  assert.match(smtp, /redactSecret/);
  assert.match(smtp, /\[redacted\]/);
  assert.match(smtp, /error: sanitizeSmtpOperationalError\(error\)/);
  assert.doesNotMatch(smtp, /console\.(log|debug|info|error|warn)\(/);
  assert.doesNotMatch(smtp, /JSON\.stringify\([\s\S]*password/);
  assert.doesNotMatch(notify, /SMTP_PASSWORD/);
  assert.doesNotMatch(enterprise, /SMTP_PASSWORD/);
  assert.doesNotMatch(notify, /result\.error/);
  assert.doesNotMatch(enterprise, /result\.error/);
});

test("missing native SMTP configuration fails safely without Resend", () => {
  const smtp = readSource("src/lib/email/provider/smtp.ts");
  const env = readSource("src/lib/env/email.ts");
  const provider = readSource("src/lib/email/provider/index.ts");
  const resend = readSource("src/lib/email/provider/resend.ts");

  assert.match(smtp, /SMTP is not configured for this environment/);
  assert.match(provider, /if \(!isEmailConfigured\(\)\)/);
  assert.match(provider, /Email delivery is not configured for this environment/);
  const smtpConfigured = env.match(/case "smtp":[\s\S]*?default:/)?.[0] ?? "";
  assert.match(smtpConfigured, /SMTP_FROM/);
  assert.doesNotMatch(smtpConfigured, /RESEND_API_KEY/);
  assert.doesNotMatch(smtp, /RESEND_API_KEY/);
  assert.doesNotMatch(smtp, /from "resend"|from 'resend'/);
  assert.match(resend, /getOptionalResendApiKey/);
  assert.match(provider, /case "resend":\s*return sendViaResend/);
  assert.match(provider, /case "smtp":\s*return sendViaSmtp/);
});

test(".env.example documents STRATO SMTP placeholders and never a real password", () => {
  const example = readSource(".env.example");

  assert.match(example, /^EMAIL_PROVIDER=smtp$/m);
  assert.match(example, /^SMTP_HOST=smtp\.strato\.de$/m);
  assert.match(example, /^SMTP_PORT=465$/m);
  assert.match(example, /^SMTP_SECURE=true$/m);
  assert.match(example, /^SMTP_USER=$/m);
  assert.match(example, /^SMTP_PASSWORD=$/m);
  assert.match(example, /^SMTP_FROM=$/m);
  assert.doesNotMatch(example, /SMTP_PASSWORD=.+/);
  assert.doesNotMatch(example, /SMTP_RELAY_URL/);
});
