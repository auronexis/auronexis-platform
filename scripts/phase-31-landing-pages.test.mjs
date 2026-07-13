import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

test("phase 31 feature pages registry has 14 static routes", () => {
  const features = readSource("src/lib/seo/feature-content.ts");
  const page = readSource("src/app/(marketing)/features/[slug]/page.tsx");
  assert.match(features, /FEATURE_PAGES/);
  assert.match(features, /ai-executive-reports/);
  assert.match(features, /activity-timeline/);
  assert.match(page, /generateStaticParams/);
  assert.match(page, /LandingPageView/);
  const slugCount = (features.match(/slug: "/g) ?? []).length;
  assert.equal(slugCount, 14);
});

test("phase 31 audience and industry pages use static generation", () => {
  const audience = readSource("src/lib/seo/audience-content.ts");
  const industry = readSource("src/lib/seo/industry-content.ts");
  const useCasePage = readSource("src/app/(marketing)/use-cases/[slug]/page.tsx");
  const industryPage = readSource("src/app/(marketing)/industries/[slug]/page.tsx");
  assert.match(audience, /AUDIENCE_PAGES/);
  assert.match(industry, /INDUSTRY_PAGES/);
  assert.match(useCasePage, /generateStaticParams/);
  assert.match(industryPage, /generateStaticParams/);
  const audienceSlugs = (audience.match(/slug: "/g) ?? []).length;
  const industrySlugs = (industry.match(/slug: "/g) ?? []).length;
  assert.equal(audienceSlugs, 9);
  assert.equal(industrySlugs, 9);
});

test("marketing navigation includes solutions and industries hubs", () => {
  const content = readSource("src/lib/marketing/content.ts");
  const links = readSource("src/lib/company/company-links.ts");
  assert.match(content, /Solutions/);
  assert.match(content, /Industries/);
  assert.match(links, /solutions: "\/solutions"/);
  assert.match(links, /industries: "\/industries"/);
  assert.match(links, /faq: "\/faq"/);
});

test("PAGE_SEO registry includes new hub routes and landing registries", () => {
  const routes = readSource("src/lib/seo/routes.ts");
  assert.match(routes, /FEATURE_PAGES/);
  assert.match(routes, /AUDIENCE_PAGES/);
  assert.match(routes, /INDUSTRY_PAGES/);
  assert.match(routes, /MARKETING_ROUTES\.solutions/);
  assert.match(routes, /MARKETING_ROUTES\.industries/);
  assert.match(routes, /MARKETING_ROUTES\.faq/);
});

test("sitemap includes feature use-case and industry routes", () => {
  const links = readSource("src/lib/company/company-links.ts");
  assert.match(links, /FEATURE_ROUTES/);
  assert.match(links, /USE_CASE_ROUTES/);
  assert.match(links, /INDUSTRY_ROUTES/);
  assert.match(links, /Object\.values\(FEATURE_ROUTES\)/);
  assert.match(links, /Object\.values\(USE_CASE_ROUTES\)/);
  assert.match(links, /Object\.values\(INDUSTRY_ROUTES\)/);
});

test("faq page and content cover enterprise topics", () => {
  const faqPage = readSource("src/app/(marketing)/faq/page.tsx");
  const faqContent = readSource("src/lib/marketing/faq-content.ts");
  assert.match(faqPage, /createPageMetadataForPath/);
  assert.match(faqContent, /billing/);
  assert.match(faqContent, /security/);
  assert.match(faqContent, /enterprise/);
  assert.match(faqContent, /client-portal/);
});

test("landing pages use shared view with conversion CTA", () => {
  const view = readSource("src/components/marketing/landing-page-view.tsx");
  assert.match(view, /MarketingCtaSection/);
  assert.match(view, /problem/);
  assert.match(view, /enterpriseAdvantages/);
});

test("feature CTA no longer links to private intelligence route", () => {
  const content = readSource("src/lib/marketing/content.ts");
  assert.doesNotMatch(content, /ctaHref: "\/intelligence"/);
  assert.match(content, /executive-dashboards/);
});
