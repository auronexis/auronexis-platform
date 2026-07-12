import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

test("canonical public host resolves to www.auroranexis.com", () => {
  const seo = readSource("src/lib/company/company-seo.ts");
  const metadata = readSource("src/lib/seo/metadata.ts");
  const information = readSource("src/lib/company/company-information.ts");
  const domains = readSource("src/lib/deployment/production-domains.ts");
  assert.match(seo, /PUBLIC_CANONICAL_ORIGIN/);
  assert.match(seo, /PRODUCTION_DOMAINS\.www/);
  assert.match(seo, /resolveCanonicalBaseUrl/);
  assert.match(metadata, /resolveCanonicalBaseUrl/);
  assert.match(information, /https:\/\/www\.auroranexis\.com/);
  assert.match(domains, /www: "www\.auroranexis\.com"/);
});

test("preview deployments are noindex", () => {
  const metadata = readSource("src/lib/seo/metadata.ts");
  const branding = readSource("src/lib/branding/metadata.ts");
  assert.match(metadata, /isPreviewDeployment/);
  assert.match(metadata, /VERCEL_ENV/);
  assert.match(branding, /isPreviewDeployment/);
});

test("private route prefixes block dashboard and workspace surfaces", () => {
  const routes = readSource("src/lib/seo/routes.ts");
  const robots = readSource("src/lib/seo/robots.ts");
  assert.match(routes, /PRIVATE_ROUTE_PREFIXES/);
  assert.match(routes, /\/onboarding/);
  assert.match(routes, /\/copilot/);
  assert.match(routes, /\/intelligence/);
  assert.match(robots, /PRIVATE_ROUTE_PREFIXES/);
});

test("auth routes are noindex", () => {
  const routes = readSource("src/lib/seo/routes.ts");
  assert.match(routes, /\/login/);
  assert.match(routes, /\/signup/);
  assert.match(routes, /NOINDEX_ROUTES/);
});

test("dashboard and client portal layouts export private app metadata", () => {
  const dashboard = readSource("src/app/(dashboard)/layout.tsx");
  const portal = readSource("src/app/client-portal/(portal)/layout.tsx");
  assert.match(dashboard, /createPrivateAppMetadata/);
  assert.match(portal, /createPrivateAppMetadata/);
});

test("sitemap excludes private routes and uses public sitemap registry", () => {
  const sitemap = readSource("src/lib/seo/sitemap.ts");
  const links = readSource("src/lib/company/company-links.ts");
  assert.match(sitemap, /PUBLIC_SITEMAP_ROUTES/);
  assert.match(links, /PUBLIC_SITEMAP_ROUTES/);
  assert.doesNotMatch(sitemap, /\/dashboard/);
  assert.doesNotMatch(sitemap, /\/settings/);
  assert.doesNotMatch(sitemap, /lastModified:\s*new Date/);
});

test("sitemap contains critical public routes", () => {
  const links = readSource("src/lib/company/company-links.ts");
  for (const route of ["/pricing", "/features", "/enterprise", "/integrations", "/status", "/docs"]) {
    assert.match(links, new RegExp(route.replace("/", "\\/")));
  }
});

test("robots references sitemap and does not block assets", () => {
  const robots = readSource("src/lib/seo/robots.ts");
  assert.match(robots, /sitemap\.xml/);
  assert.match(robots, /allow:\s*"\//);
  assert.doesNotMatch(robots, /\/_next/);
  assert.doesNotMatch(robots, /\/branding/);
});

test("PAGE_SEO registry has unique titles for critical pages", () => {
  const routes = readSource("src/lib/seo/routes.ts");
  const titles = [...routes.matchAll(/title:\s*"([^"]+)"/g)].map((match) => match[1]);
  const critical = ["Pricing", "Features", "Enterprise", "Integrations", "Platform Status"];
  for (const title of critical) {
    assert.ok(titles.includes(title), `missing PAGE_SEO title: ${title}`);
  }
  assert.equal(new Set(titles).size, titles.length, "duplicate PAGE_SEO titles detected");
});

test("metadata uses absolute canonical URLs and OG images", () => {
  const metadata = readSource("src/lib/seo/metadata.ts");
  assert.match(metadata, /canonical: url\.toString\(\)/);
  assert.match(metadata, /resolveOpenGraphImageUrl/);
  assert.match(metadata, /toString\(\)/);
});

test("pricing structured data matches canonical billing plan prices", () => {
  const schema = readSource("src/lib/company/company-schema.ts");
  const plans = readSource("src/lib/billing/plans.ts");
  assert.match(schema, /pricingPageJsonLd/);
  assert.match(schema, /PUBLIC_SELF_SERVE_PLAN_KEYS/);
  assert.match(schema, /getPlanByKey/);
  assert.match(plans, /priceMonthly: 149/);
  assert.match(plans, /priceMonthly: 499/);
  assert.match(plans, /priceMonthly: 1499/);
  assert.doesNotMatch(schema, /aggregateRating/);
  assert.doesNotMatch(schema, /reviewCount/);
});

test("documentation pages emit TechArticle structured data", () => {
  const docs = readSource("src/app/docs/[slug]/page.tsx");
  const structured = readSource("src/lib/seo/structured-data.ts");
  assert.match(docs, /techArticleJsonLd/);
  assert.match(structured, /TechArticle/);
});

test("no fake review schema in structured data modules", () => {
  const schema = readSource("src/lib/company/company-schema.ts");
  assert.doesNotMatch(schema, /Review/);
  assert.doesNotMatch(schema, /ratingValue/);
});

test("GA4 and Clarity load once with consent gating", () => {
  const analytics = readSource("src/components/analytics/analytics-provider.tsx");
  const clarity = readSource("src/components/analytics/clarity-script.tsx");
  assert.match(analytics, /getElementById\("ga4-script"\)/);
  assert.match(analytics, /sinksRegistered/);
  assert.match(clarity, /hasAnalyticsConsent/);
  assert.doesNotMatch(analytics, /gtag\('config'.*gtag\('config'/);
});

test("Search Console verification metadata remains wired", () => {
  const metadata = readSource("src/lib/seo/metadata.ts");
  const branding = readSource("src/lib/branding/metadata.ts");
  assert.match(metadata, /NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION/);
  assert.match(metadata, /NEXT_PUBLIC_BING_SITE_VERIFICATION/);
  assert.match(branding, /getSiteVerificationMetadata/);
});

test("not-found page is noindex", () => {
  const notFound = readSource("src/app/not-found.tsx");
  assert.match(notFound, /noIndex:\s*true/);
});

test("package.json exposes technical SEO test script", () => {
  const pkg = readSource("package.json");
  assert.match(pkg, /test:technical-seo/);
});
