import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

test("trust pages use PAGE_SEO registry metadata", () => {
  const routes = readSource("src/lib/seo/routes.ts");
  for (const key of ["about", "support", "help", "status", "faq", "contact", "security", "compliance"]) {
    assert.match(routes, new RegExp(`MARKETING_ROUTES\\.${key}`));
  }
});

test("legal pages are included in public sitemap routes", () => {
  const links = readSource("src/lib/company/company-links.ts");
  for (const path of ["/privacy", "/terms", "/imprint", "/security-policy", "/subprocessors", "/data-processing-agreement"]) {
    assert.match(links, new RegExp(path.replace("/", "\\/")));
  }
});

test("support and contact pages split active and future enterprise channels", () => {
  const support = readSource("src/app/(marketing)/support/page.tsx");
  const contact = readSource("src/app/(marketing)/contact/page.tsx");
  const card = readSource("src/components/marketing/enterprise-contact-card.tsx");
  const channels = readSource("src/lib/company/contact-channels.ts");
  assert.match(channels, /id: "legal"[\s\S]*category: "active"/);
  assert.match(channels, /id: "general"[\s\S]*category: "active"/);
  assert.match(support, /ACTIVE_ENTERPRISE_CONTACT_CHANNELS/);
  assert.match(support, /FUTURE_ENTERPRISE_CONTACT_CHANNELS/);
  assert.match(contact, /ACTIVE_ENTERPRISE_CONTACT_CHANNELS/);
  assert.match(contact, /FUTURE_ENTERPRISE_CONTACT_CHANNELS/);
  assert.doesNotMatch(card, /Mailbox pending/i);
  assert.doesNotMatch(card, /reserved/i);
  assert.doesNotMatch(card, /until monitoring begins/i);
});

test("footer and navigation include help and trust surfaces", () => {
  const links = readSource("src/lib/company/company-links.ts");
  const content = readSource("src/lib/marketing/content.ts");
  assert.match(links, /help: "\/help"/);
  assert.match(links, /label: "Help"/);
  assert.match(content, /MARKETING_NAV/);
  assert.match(content, /MARKETING_ROUTES\.security/);
});

test("testimonials are labeled as representative priorities not customer quotes", () => {
  const testimonials = readSource("src/components/marketing/marketing-testimonials.tsx");
  const content = readSource("src/lib/marketing/content.ts");
  assert.match(testimonials, /not customer testimonials/);
  assert.match(content, /Representative priority/);
  assert.doesNotMatch(content, /customer said/i);
});

test("certification claims remain guarded across marketing and legal surfaces", () => {
  const content = readSource("src/lib/marketing/content.ts");
  const compliance = readSource("src/app/(marketing)/compliance/page.tsx");
  const llms = readSource("src/lib/seo/llms-txt.ts");
  assert.match(content, /no SOC 2 certification claim/);
  assert.match(content, /no certification claimed/);
  assert.match(compliance, /do not claim certifications/i);
  assert.match(llms, /Do not claim SOC 2/);
});

test("about page exposes company identity for enterprise evaluation", () => {
  const about = readSource("src/app/(marketing)/about/page.tsx");
  assert.match(about, /Company identity/);
  assert.match(about, /COMPANY_INFORMATION\.legalName/);
  assert.match(about, /Evaluate Auroranexis/);
  assert.match(about, /aboutPageJsonLd/);
});

test("documentation path clarifies marketing entry vs docs hub", () => {
  const documentation = readSource("src/app/(marketing)/documentation/page.tsx");
  assert.match(documentation, /href="\/docs"/);
  assert.match(documentation, /marketing entry point/i);
});

test("all documentation slugs are in sitemap and PAGE_SEO registry", () => {
  const registry = readSource("src/lib/docs/registry.ts");
  const links = readSource("src/lib/company/company-links.ts");
  const routes = readSource("src/lib/seo/routes.ts");
  assert.match(registry, /DOC_PAGE_SLUGS/);
  assert.match(links, /DOC_PAGE_SLUGS/);
  assert.match(routes, /buildDocPageSeo/);
  const slugCount = (registry.match(/slug: "/g) ?? []).length;
  assert.ok(slugCount >= 17, "expected full documentation registry");
});

test("pilot program CTA uses invite-only request invitation wording", () => {
  const cta = readSource("src/lib/marketing/cta.ts");
  const pilot = readSource("src/app/(marketing)/pilot-program/page.tsx");
  assert.match(cta, /Request invitation/);
  assert.doesNotMatch(cta, /Join pilot program/);
  assert.match(pilot, /Invite-only/i);
});

test("status page uses public status resolution without inventing uptime claims", () => {
  const status = readSource("src/app/(marketing)/status/page.tsx");
  const publicStatus = readSource("src/lib/marketing/public-status.ts");
  assert.match(status, /createPageMetadataForPath/);
  assert.match(publicStatus, /resolvePublicAiStatus/);
  assert.doesNotMatch(status, /99\.9%/);
});

test("private routes and preview deployments remain non-indexable", () => {
  const routes = readSource("src/lib/seo/routes.ts");
  const metadata = readSource("src/lib/seo/metadata.ts");
  assert.match(routes, /PRIVATE_ROUTE_PREFIXES/);
  assert.match(routes, /NOINDEX_ROUTES/);
  assert.match(metadata, /isPreviewDeployment/);
});
