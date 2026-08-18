import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const INFO = "info@auroranexis.com";
const SALES = "sales@auroranexis.com";
const SUPPORT = "support@auroranexis.com";
const SECURITY = "security@auroranexis.com";
const BRAND_LINE = "Operations Command Center for AI automation agencies.";
const CONTACT_SUCCESS =
  "Thank you. Your message has been received. Our team will follow up by email.";

function mailboxFromCompany(key) {
  const company = readSource("src/lib/company/company-contact.ts");
  const match = company.match(new RegExp(`${key}:\\s*"([^"]+)"`));
  assert.ok(match, `COMPANY_CONTACT.${key} must be defined`);
  return match[1];
}

function composeFinalRecipient(inboxKey) {
  const stages = readSource("src/lib/sales/pipeline-stages.ts");
  const company = readSource("src/lib/company/company-contact.ts");
  const smtp = readSource("src/lib/email/provider/smtp.ts");
  const notify = readSource("src/lib/sales/notify.ts");

  const exportName = {
    info: "INFO_EMAIL",
    sales: "SALES_EMAIL",
    support: "SUPPORT_EMAIL",
    security: "SECURITY_EMAIL",
  }[inboxKey];
  assert.ok(exportName, `unknown inbox key ${inboxKey}`);

  const companyField = {
    info: "infoEmail",
    sales: "salesEmail",
    support: "supportEmail",
    security: "securityEmail",
  }[inboxKey];

  assert.match(stages, new RegExp(`key: "${inboxKey}"[\\s\\S]*email: ${exportName}`));
  assert.match(notify, /const to = getInboxEmail\(input\.inboxKey\)/);
  assert.match(notify, /sendEmail\(\{[\s\S]*to,/);
  assert.match(smtp, /to: message\.to/);
  assert.match(smtp, /transporter\.sendMail\(mail\)/);
  assert.doesNotMatch(smtp, /to:\s*config\.user/);
  assert.doesNotMatch(smtp, /to:\s*process\.env\.SMTP_FROM/);
  assert.doesNotMatch(stages, /\?\?\s*SALES_EMAIL/);

  return mailboxFromCompany(companyField);
}

test("1 generic /contact final sendMail to is info@ not sales@", () => {
  const capture = readSource("src/lib/sales/capture-actions.ts");
  const contactAction = readSource("src/lib/marketing/contact-action.ts");
  const form = readSource("src/components/marketing/contact-form.tsx");

  assert.match(form, /submitContactForm/);
  assert.match(contactAction, /submitContactLead/);
  assert.match(capture, /source: "contact",\s*inboxKey: "info"/);
  assert.doesNotMatch(capture, /source: "contact",\s*inboxKey: "sales"/);

  const to = composeFinalRecipient("info");
  assert.equal(to, INFO);
  assert.notEqual(to, SALES);
});

test("2 generic contact success copy is neutral and not pilot program", () => {
  const form = readSource("src/components/marketing/contact-form.tsx");
  assert.match(form, new RegExp(CONTACT_SUCCESS.replaceAll(".", "\\.")));
  assert.doesNotMatch(form, /pilot program/i);
  assert.doesNotMatch(form, /referral/i);
  assert.doesNotMatch(form, /enterprise/i);
  assert.doesNotMatch(form, /sales team/i);
});

test("3 SMTP From is independent from Contact To", () => {
  const notify = readSource("src/lib/sales/notify.ts");
  const env = readSource("src/lib/env/email.ts");
  const smtp = readSource("src/lib/email/provider/smtp.ts");

  assert.match(notify, /const from = getDefaultFromEmail\(\)/);
  assert.match(notify, /const to = getInboxEmail\(input\.inboxKey\)/);
  assert.match(env, /process\.env\.SMTP_FROM/);
  assert.match(smtp, /from: message\.from/);
  assert.match(smtp, /to: message\.to/);
  assert.doesNotMatch(smtp, /to:\s*process\.env\.SMTP_FROM/);
  assert.doesNotMatch(smtp, /to:\s*config\.user/);
  assert.doesNotMatch(notify, /to:\s*from/);
});

test("4 envelope diagnostics log category recipient from correlation without secrets", () => {
  const notify = readSource("src/lib/sales/notify.ts");
  const smtp = readSource("src/lib/email/provider/smtp.ts");

  assert.match(
    notify,
    /\[email\] lead envelope source=\$\{input\.source\} inbox=\$\{input\.inboxKey\} to=\$\{to\} from=\$\{from\} correlation=\$\{correlationId\}/,
  );
  assert.match(smtp, /\[email\] smtp sendMail to=\$\{formatEnvelopeAddress\(mail\.to\)\} from=\$\{mail\.from\}/);
  assert.doesNotMatch(notify, /SMTP_PASSWORD/);
  assert.doesNotMatch(notify, /process\.env\.SMTP_PASSWORD/);
  assert.doesNotMatch(smtp, /console\.info\([\s\S]*password/);
  assert.doesNotMatch(smtp, /console\.info\([\s\S]*SMTP_PASSWORD/);
});

test("5 unknown inbox keys fail closed instead of falling back to sales@", () => {
  const stages = readSource("src/lib/sales/pipeline-stages.ts");
  assert.match(stages, /Unknown sales inbox key/);
  assert.doesNotMatch(stages, /\?\?\s*SALES_EMAIL/);
});

test("6 referral final recipient is sales@", () => {
  const capture = readSource("src/lib/sales/capture-actions.ts");
  assert.match(capture, /source: "referral",\s*inboxKey: "sales"/);
  assert.equal(composeFinalRecipient("sales"), SALES);
});

test("7 support mailbox mapping stays support@", () => {
  assert.equal(composeFinalRecipient("support"), SUPPORT);
  const channels = readSource("src/lib/company/contact-channels.ts");
  assert.match(channels, /id: "support"[\s\S]*email: SUPPORT_EMAIL/);
});

test("8 security mailbox mapping stays security@", () => {
  assert.equal(composeFinalRecipient("security"), SECURITY);
  const disclosure = readSource("src/lib/security/vulnerability-disclosure.ts");
  assert.match(disclosure, /COMPANY_CONTACT\.securityEmail/);
});

test("9 authenticated footer includes canonical brand description", () => {
  const footer = readSource("src/components/layout/site-footer.tsx");
  const links = readSource("src/lib/company/company-links.ts");
  const minimal = footer.match(/if \(variant === "minimal"\) \{[\s\S]*?(?=if \(variant === "marketing"\))/)?.[0] ?? "";

  assert.match(links, /export const FOOTER_BRAND_DESCRIPTION/);
  assert.match(links, new RegExp(BRAND_LINE.replaceAll(".", "\\.")));
  assert.ok(minimal.length > 0);
  assert.match(minimal, /FOOTER_BRAND_DESCRIPTION/);
  assert.match(minimal, /AdaptiveBrandLogo/);
});

test("10 authenticated footer includes support@", () => {
  const footer = readSource("src/components/layout/site-footer.tsx");
  const minimal = footer.match(/if \(variant === "minimal"\) \{[\s\S]*?(?=if \(variant === "marketing"\))/)?.[0] ?? "";
  assert.match(minimal, /mailto:\$\{SUPPORT_EMAIL\}/);
  assert.match(minimal, /\{SUPPORT_EMAIL\}/);
});

test("11 authenticated footer includes Sales: sales@", () => {
  const footer = readSource("src/components/layout/site-footer.tsx");
  const minimal = footer.match(/if \(variant === "minimal"\) \{[\s\S]*?(?=if \(variant === "marketing"\))/)?.[0] ?? "";
  assert.match(minimal, /Sales:/);
  assert.match(minimal, /mailto:\$\{SALES_EMAIL\}/);
  assert.match(minimal, /\{SALES_EMAIL\}/);
});

test("12 authenticated Product links remain vertical columns", () => {
  const footer = readSource("src/components/layout/site-footer.tsx");
  const minimal = footer.match(/if \(variant === "minimal"\) \{[\s\S]*?(?=if \(variant === "marketing"\))/)?.[0] ?? "";
  assert.match(minimal, /FooterLinkColumn title="Product" links=\{FOOTER_SECTIONS\.product\}/);
  assert.match(footer, /<ul className="mt-3 space-y-2">/);
});

test("13 authenticated Legal links remain vertical columns", () => {
  const footer = readSource("src/components/layout/site-footer.tsx");
  const minimal = footer.match(/if \(variant === "minimal"\) \{[\s\S]*?(?=if \(variant === "marketing"\))/)?.[0] ?? "";
  assert.match(minimal, /FooterLinkColumn title="Legal" links=\{FOOTER_SECTIONS\.legal\}/);
});

test("14 authenticated Company links remain vertical columns", () => {
  const footer = readSource("src/components/layout/site-footer.tsx");
  const minimal = footer.match(/if \(variant === "minimal"\) \{[\s\S]*?(?=if \(variant === "marketing"\))/)?.[0] ?? "";
  assert.match(minimal, /FooterLinkColumn title="Company" links=\{FOOTER_SECTIONS\.company\}/);
  assert.doesNotMatch(minimal, /FOOTER_LINKS\.map/);
});

test("15 public marketing footer IA is unchanged", () => {
  const footer = readSource("src/components/layout/site-footer.tsx");
  const marketing =
    footer.match(
      /if \(variant === "marketing"\) \{[\s\S]*CookiePreferencesButton[\s\S]*?(?=\n  return \()/,
    )?.[0] ?? "";
  assert.ok(marketing.length > 0);
  assert.match(marketing, /border-t border-white\/10 bg-secondary/);
  assert.match(marketing, /BrandLogo/);
  assert.match(marketing, /FOOTER_BRAND_DESCRIPTION/);
  assert.match(marketing, /text-sm leading-relaxed text-primary-foreground\/75/);
  assert.match(marketing, /mailto:\$\{SUPPORT_EMAIL\}/);
  assert.match(marketing, /Sales:/);
  assert.match(marketing, /FooterLinkColumn dark title="Product" links=\{FOOTER_SECTIONS\.product\}/);
  assert.match(marketing, /FooterLinkColumn dark title="Legal" links=\{FOOTER_SECTIONS\.legal\}/);
  assert.match(marketing, /FooterLinkColumn dark title="Company" links=\{FOOTER_SECTIONS\.company\}/);
  assert.match(marketing, /CookiePreferencesButton/);
});

test("16 enterprise notification recipient remains sales@", () => {
  const notify = readSource("src/lib/enterprise/notify.ts");
  const company = readSource("src/lib/company/company-contact.ts");
  assert.match(company, /salesEmail: "sales@auroranexis\.com"/);
  assert.match(notify, /to:\s*SALES_EMAIL/);
  assert.doesNotMatch(notify, /to:\s*INFO_EMAIL/);
  assert.doesNotMatch(notify, /to:\s*input\./);
});

test("17 enterprise email keeps structured ENTERPRISE REQUEST fields", () => {
  const notify = readSource("src/lib/enterprise/notify.ts");
  assert.match(notify, /ENTERPRISE REQUEST/);
  assert.match(notify, /labeledPlainText\("Requested Seats"/);
  assert.match(notify, /labeledPlainText\("Requested Clients"/);
  assert.match(notify, /labeledPlainText\("Organization ID"/);
  assert.match(notify, /labeledPlainText\("Request ID"/);
  assert.match(notify, /labeledPlainText\("Notes"/);
  assert.match(notify, /labeledPlainText\("Correlation ID"/);
});

test("18 enterprise copy-safe IDs stay monospace in HTML", () => {
  const notify = readSource("src/lib/enterprise/notify.ts");
  assert.match(notify, /Organization ID.*true/);
  assert.match(notify, /Request ID.*true/);
  assert.match(notify, /Correlation ID.*true/);
  assert.match(notify, /monospace = false/);
});

test("pilot and referral success copy stay distinct from generic contact", () => {
  const contact = readSource("src/components/marketing/contact-form.tsx");
  const pilot = readSource("src/components/marketing/pilot-application-form.tsx");
  const referral = readSource("src/components/marketing/referral-lead-form.tsx");

  assert.match(pilot, /Your pilot application has been received/);
  assert.match(referral, /Referral received/);
  assert.doesNotMatch(contact, /pilot application/);
  assert.doesNotMatch(contact, /Referral received/);
});
