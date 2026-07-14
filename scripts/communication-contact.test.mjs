import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

test("company contact uses correct sales address", () => {
  const contact = readSource("src/lib/company/company-contact.ts");
  assert.match(contact, /salesEmail: "sales@auroranexis\.com"/);
  assert.doesNotMatch(contact, /salesEmail: "support@auroranexis\.com"/);
});

test("enterprise contact channels define active and future mailboxes", () => {
  const channels = readSource("src/lib/company/contact-channels.ts");
  const companyContact = readSource("src/lib/company/company-contact.ts");
  const supportPage = readSource("src/app/(marketing)/support/page.tsx");
  const contactPage = readSource("src/app/(marketing)/contact/page.tsx");
  const card = readSource("src/components/marketing/enterprise-contact-card.tsx");

  assert.match(companyContact, /supportEmail: "support@auroranexis\.com"/);
  assert.match(companyContact, /salesEmail: "sales@auroranexis\.com"/);
  assert.match(companyContact, /securityEmail: "security@auroranexis\.com"/);
  assert.match(companyContact, /infoEmail: "info@auroranexis\.com"/);
  assert.match(companyContact, /legalEmail: "legal@auroranexis\.com"/);
  assert.match(companyContact, /privacyEmail: "privacy@auroranexis\.com"/);
  assert.match(companyContact, /partnersEmail: "partners@auroranexis\.com"/);
  assert.match(companyContact, /pressEmail: "press@auroranexis\.com"/);
  assert.match(channels, /SUPPORT_EMAIL/);
  assert.match(channels, /SALES_EMAIL/);
  assert.match(channels, /SECURITY_EMAIL/);
  assert.match(channels, /LEGAL_EMAIL/);
  assert.match(channels, /INFO_EMAIL/);
  assert.match(channels, /PRIVACY_EMAIL/);
  assert.match(channels, /PARTNERS_EMAIL/);
  assert.match(channels, /PRESS_EMAIL/);
  assert.match(channels, /mailto:/);
  assert.match(supportPage, /ACTIVE_ENTERPRISE_CONTACT_CHANNELS/);
  assert.match(supportPage, /FUTURE_ENTERPRISE_CONTACT_CHANNELS/);
  assert.match(supportPage, /EnterpriseContactCard/);
  assert.match(contactPage, /ACTIVE_ENTERPRISE_CONTACT_CHANNELS/);
  assert.match(contactPage, /FUTURE_ENTERPRISE_CONTACT_CHANNELS/);
  assert.match(card, /href=\{channel\.mailtoHref\}/);
  assert.match(card, /aria-label/);
});

test("public AI status maps configured provider to operational with explicit failure reasons", () => {
  const publicStatus = readSource("src/lib/marketing/public-status.ts");
  const statusPage = readSource("src/app/(marketing)/status/page.tsx");

  assert.match(publicStatus, /getOpenAIPlatformStatus/);
  assert.match(publicStatus, /getOpenAIPlatformConfig/);
  assert.match(publicStatus, /case "configured":/);
  assert.match(publicStatus, /detail: "Operational"/);
  assert.match(publicStatus, /Missing API Key/);
  assert.match(publicStatus, /Provider Disabled/);
  assert.match(publicStatus, /Invalid Configuration/);
  assert.match(publicStatus, /API Timeout/);
  assert.doesNotMatch(publicStatus, /mapOpenAIStateToPublicDetail/);
  assert.doesNotMatch(publicStatus, /detail: "Unknown"/);
  assert.match(publicStatus, /try \{/);
  assert.match(statusPage, /await resolvePublicAiStatus/);
});

test("public contact surfaces do not expose internal mailbox pending state", () => {
  const channels = readSource("src/lib/company/contact-channels.ts");
  const card = readSource("src/components/marketing/enterprise-contact-card.tsx");
  const contactPage = readSource("src/app/(marketing)/contact/page.tsx");
  const supportPage = readSource("src/app/(marketing)/support/page.tsx");

  assert.match(channels, /id: "legal"[\s\S]*category: "active"/);
  assert.match(channels, /id: "general"[\s\S]*category: "active"/);
  assert.match(channels, /id: "privacy"[\s\S]*category: "future"/);
  assert.match(channels, /FUTURE_ENTERPRISE_CONTACT_CHANNELS/);
  assert.doesNotMatch(card, /Mailbox pending/i);
  assert.doesNotMatch(card, /reserved/i);
  assert.doesNotMatch(card, /until monitoring begins/i);
  assert.doesNotMatch(card, /category === "future"/);
  assert.doesNotMatch(contactPage, /Mailbox pending/i);
  assert.doesNotMatch(contactPage, /reserved/i);
  assert.doesNotMatch(contactPage, /until monitoring begins/i);
  assert.doesNotMatch(supportPage, /Mailbox pending/i);
  assert.doesNotMatch(supportPage, /reserved/i);
  assert.doesNotMatch(supportPage, /until monitoring begins/i);
});

test("active contact mailto links map to dedicated mailboxes", () => {
  const channels = readSource("src/lib/company/contact-channels.ts");
  const companyContact = readSource("src/lib/company/company-contact.ts");

  assert.match(channels, /id: "support"[\s\S]*email: SUPPORT_EMAIL/);
  assert.match(channels, /id: "sales"[\s\S]*email: SALES_EMAIL/);
  assert.match(channels, /id: "security"[\s\S]*email: SECURITY_EMAIL/);
  assert.match(channels, /id: "legal"[\s\S]*email: LEGAL_EMAIL/);
  assert.match(channels, /id: "general"[\s\S]*email: INFO_EMAIL/);
  assert.match(companyContact, /legalEmail: "legal@auroranexis\.com"/);
  assert.match(companyContact, /infoEmail: "info@auroranexis\.com"/);
  assert.doesNotMatch(channels, /id: "sales"[\s\S]*email: SUPPORT_EMAIL/);
});

test("support page routes sales and security to dedicated mailboxes", () => {
  const channels = readSource("src/lib/company/contact-channels.ts");
  const companyContact = readSource("src/lib/company/company-contact.ts");
  assert.match(channels, /id: "sales"[\s\S]*email: SALES_EMAIL/);
  assert.match(channels, /id: "security"[\s\S]*email: SECURITY_EMAIL/);
  assert.match(companyContact, /salesEmail: "sales@auroranexis\.com"/);
  assert.doesNotMatch(companyContact, /salesEmail: "support@auroranexis\.com"/);
});
