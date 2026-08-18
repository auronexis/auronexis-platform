import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("canonical mailboxes live only in COMPANY_CONTACT for runtime routing", () => {
  const company = readSource("src/lib/company/company-contact.ts");
  const stages = readSource("src/lib/sales/pipeline-stages.ts");
  const channels = readSource("src/lib/company/contact-channels.ts");
  const billing = readSource("src/lib/billing/billing-contact.ts");
  const enterpriseNotify = readSource("src/lib/enterprise/notify.ts");

  for (const address of [
    "support@auroranexis.com",
    "sales@auroranexis.com",
    "info@auroranexis.com",
    "security@auroranexis.com",
  ]) {
    assert.match(company, new RegExp(address.replaceAll(".", "\\.")));
  }

  assert.match(stages, /key: "support"[\s\S]*email: SUPPORT_EMAIL/);
  assert.match(stages, /key: "sales"[\s\S]*email: SALES_EMAIL/);
  assert.match(stages, /key: "info"[\s\S]*email: INFO_EMAIL/);
  assert.match(stages, /key: "security"[\s\S]*email: SECURITY_EMAIL/);
  assert.match(channels, /email: SUPPORT_EMAIL/);
  assert.match(channels, /email: SALES_EMAIL/);
  assert.match(billing, /email: SUPPORT_EMAIL/);
  assert.match(billing, /email: SALES_EMAIL/);
  assert.match(enterpriseNotify, /to:\s*SALES_EMAIL/);
  assert.doesNotMatch(enterpriseNotify, /to:\s*input\./);
  assert.doesNotMatch(stages, /support@auroranexis\.com/);
  assert.doesNotMatch(billing, /support@auroranexis\.com/);
});

test("public capture surfaces map to intended inboxes and use sendEmail facade", () => {
  const capture = readSource("src/lib/sales/capture-actions.ts");
  const notify = readSource("src/lib/sales/notify.ts");
  const contactAction = readSource("src/lib/marketing/contact-action.ts");
  const contactForm = readSource("src/components/marketing/contact-form.tsx");
  const referralForm = readSource("src/components/marketing/referral-lead-form.tsx");
  const demoForm = readSource("src/components/marketing/demo-booking-form.tsx");
  const newsletterForm = readSource("src/components/marketing/newsletter-signup-form.tsx");
  const pilotForm = readSource("src/components/marketing/pilot-application-form.tsx");
  const provider = readSource("src/lib/email/provider/index.ts");

  assert.match(contactAction, /submitContactLead/);
  assert.match(contactForm, /submitContactForm/);
  assert.match(referralForm, /submitReferralLead/);
  assert.match(demoForm, /submitDemoRequest/);
  assert.match(newsletterForm, /submitNewsletterSignup/);
  assert.match(pilotForm, /submitPilotApplication/);

  assert.match(capture, /source: "contact",\s*inboxKey: "info"/);
  assert.doesNotMatch(capture, /source: "contact",\s*inboxKey: "sales"/);
  assert.match(capture, /source: "referral",\s*inboxKey: "sales"/);
  assert.match(capture, /source: "demo",\s*inboxKey: "sales"/);
  assert.match(capture, /source: "pilot",\s*inboxKey: "sales"/);
  assert.match(capture, /source: "newsletter",\s*inboxKey: "info"/);

  assert.match(notify, /sendEmail\(/);
  assert.match(notify, /getInboxEmail\(input\.inboxKey\)/);
  assert.match(notify, /safeReplyToAddress/);
  assert.doesNotMatch(notify, /to:\s*input\./);
  assert.doesNotMatch(notify, /from:\s*input\./);
  assert.doesNotMatch(notify, /nodemailer/i);
  assert.doesNotMatch(notify, /Resend/);
  assert.doesNotMatch(capture, /nodemailer/i);
  assert.doesNotMatch(capture, /from\("resend/i);
  assert.match(provider, /export async function sendEmail/);
});

test("lead capture fail matrix never fakes dual-path failure and keeps durable leads", () => {
  const capture = readSource("src/lib/sales/capture-actions.ts");
  const notify = readSource("src/lib/sales/notify.ts");

  assert.match(capture, /correlationId/);
  assert.match(capture, /persistFailed:\s*!persisted/);
  assert.match(capture, /correlationId,/);
  assert.match(capture, /Lead persisted but notification email failed/);
  assert.match(capture, /Lead delivered by email only/);
  assert.match(capture, /Lead capture failed on both persist and email/);
  assert.match(capture, /Unable to save your submission/);
  assert.match(capture, /from\("sales_leads"\)\.insert/);
  assert.match(notify, /\[UNPERSISTED\]/);
  assert.doesNotMatch(capture, /success:\s*true[\s\S]*both persist and email/);
});

test("enterprise request fail matrix matches persistence policy without exposing DB errors", () => {
  const actions = readSource("src/lib/enterprise/actions.ts");
  const notify = readSource("src/lib/enterprise/notify.ts");
  const card = readSource("src/components/settings/enterprise-request-card.tsx");
  const company = readSource("src/lib/company/company-contact.ts");

  assert.match(company, /salesEmail: "sales@auroranexis\.com"/);
  assert.match(actions, /from\("enterprise_requests"\)/);
  assert.match(actions, /sendEnterpriseRequestNotificationEmail/);
  assert.doesNotMatch(actions, /OPEN_REQUEST_STATUSES/);
  assert.doesNotMatch(actions, /getLatestEnterpriseRequest[\s\S]*return \{ ok: true/);
  assert.match(actions, /correlationId/);
  assert.match(actions, /delivery: "persisted"/);
  assert.match(actions, /delivery: "email_only"/);
  assert.match(actions, /SAFE_SUBMIT_ERROR|Unable to submit Enterprise request/);
  assert.match(actions, /Request delivered by email only/);
  assert.match(actions, /Request persisted but notification email failed/);
  assert.match(actions, /Request capture failed on both persist and email/);
  assert.doesNotMatch(actions, /error:\s*error\?\.message/);
  assert.doesNotMatch(actions, /toActionError/);
  assert.match(notify, /to:\s*SALES_EMAIL/);
  assert.match(notify, /safeReplyToAddress/);
  assert.match(notify, /sendEmail\(/);
  assert.match(notify, /text,/);
  assert.match(notify, /html,/);
  assert.match(notify, /ENTERPRISE REQUEST/);
  assert.match(notify, /labeledPlainText\("Company"/);
  assert.match(notify, /labeledPlainText\("Contact Email"/);
  assert.match(notify, /labeledPlainText\("Requested Seats"/);
  assert.match(notify, /labeledPlainText\("Requested Clients"/);
  assert.match(notify, /labeledPlainText\("Organization ID"/);
  assert.match(notify, /labeledPlainText\("Request ID"/);
  assert.match(notify, /labeledPlainText\("Notes"/);
  assert.match(notify, /labeledPlainText\("Correlation ID"/);
  assert.match(notify, /monospace = false/);
  assert.match(notify, /Organization ID.*true/);
  assert.match(notify, /Request ID.*true/);
  assert.doesNotMatch(notify, /Requested seats:/);
  assert.doesNotMatch(notify, /Organization id:/);
  assert.doesNotMatch(notify, /from:\s*input\./);
  assert.doesNotMatch(notify, /nodemailer/i);
  assert.doesNotMatch(notify, /Resend/);
  assert.match(card, /result\.delivery === "email_only"/);
  assert.match(card, /result\.data/);
});

test("authenticated minimal footer uses canonical PRODUCT / LEGAL / COMPANY columns", () => {
  const footer = readSource("src/components/layout/site-footer.tsx");
  const links = readSource("src/lib/company/company-links.ts");
  const shell = readSource("src/components/layout/dashboard-shell.tsx");

  assert.match(shell, /SiteFooter variant="minimal"/);
  assert.match(links, /product:\s*\[/);
  assert.match(links, /legal:\s*\[/);
  assert.match(links, /company:\s*\[/);
  assert.match(links, /label: "Features"/);
  assert.match(links, /label: "Privacy"/);
  assert.match(links, /label: "About"/);
  assert.match(links, /FOOTER_SECTIONS\.legal/);
  assert.match(links, /FOOTER_SECTIONS\.company/);
  assert.match(links, /export const FOOTER_LINKS/);

  const minimal = footer.match(/if \(variant === "minimal"\) \{[\s\S]*?(?=if \(variant === "marketing"\))/)?.[0] ?? "";
  assert.ok(minimal.length > 0, "minimal footer variant must exist");
  assert.match(minimal, /FooterLinkColumn title="Product" links=\{FOOTER_SECTIONS\.product\}/);
  assert.match(minimal, /FooterLinkColumn title="Legal" links=\{FOOTER_SECTIONS\.legal\}/);
  assert.match(minimal, /FooterLinkColumn title="Company" links=\{FOOTER_SECTIONS\.company\}/);
  assert.doesNotMatch(minimal, /FOOTER_LINKS\.map/);
  assert.doesNotMatch(minimal, /flex-wrap gap-x-/);

  assert.match(
    footer,
    /if \(variant === "marketing"\) \{[\s\S]*FooterLinkColumn dark title="Product" links=\{FOOTER_SECTIONS\.product\}[\s\S]*FooterLinkColumn dark title="Legal" links=\{FOOTER_SECTIONS\.legal\}[\s\S]*FooterLinkColumn dark title="Company" links=\{FOOTER_SECTIONS\.company\}/,
  );
  assert.doesNotMatch(footer, /FOOTER_LINKS\.slice\(0,\s*4\)/);
});

test("billing support remains mailto to support@ — not converted to ticketing", () => {
  const billing = readSource("src/lib/billing/billing-contact.ts");
  const panel = readSource("src/components/settings/billing-settings-panel.tsx");
  const supportPage = readSource("src/app/(dashboard)/settings/support/page.tsx");
  const company = readSource("src/lib/company/company-contact.ts");

  assert.match(company, /supportEmail: "support@auroranexis\.com"/);
  assert.match(billing, /SUPPORT_CONTACT_CARD[\s\S]*email: SUPPORT_EMAIL/);
  assert.match(panel, /mailto:\$\{card\.email\}/);
  assert.match(supportPage, /mailto:\$\{SUPPORT_EMAIL\}/);
  assert.doesNotMatch(panel, /createSupportTicket|submitSupportTicket/);
  assert.doesNotMatch(supportPage, /createSupportTicket|submitSupportTicket/);
});

test("security mailbox stays isolated via COMPANY_CONTACT", () => {
  const company = readSource("src/lib/company/company-contact.ts");
  const channels = readSource("src/lib/company/contact-channels.ts");
  const stages = readSource("src/lib/sales/pipeline-stages.ts");
  const accountDocs = readSource("src/lib/docs/pages/account.ts");

  assert.match(company, /securityEmail: "security@auroranexis\.com"/);
  assert.match(channels, /id: "security"[\s\S]*email: SECURITY_EMAIL/);
  assert.match(stages, /key: "security"[\s\S]*email: SECURITY_EMAIL/);
  assert.match(accountDocs, /SECURITY_EMAIL/);
  assert.doesNotMatch(accountDocs, /security@auroranexis\.com/);
});

test("SMTP readiness uses native SMTP vars and does not require a relay URL", () => {
  const env = readSource("src/lib/env/email.ts");
  const smtp = readSource("src/lib/email/provider/smtp.ts");
  const provider = readSource("src/lib/email/provider/index.ts");

  assert.match(env, /case "smtp":[\s\S]*SMTP_FROM/);
  assert.doesNotMatch(env, /SMTP_RELAY_URL/);
  assert.doesNotMatch(smtp, /SMTP_RELAY_URL/);
  assert.match(smtp, /nodemailer\.createTransport/);
  assert.match(provider, /case "smtp":[\s\S]*sendViaSmtp/);
  assert.doesNotMatch(provider, /nodemailer/i);
});
