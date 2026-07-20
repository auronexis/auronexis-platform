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
  const routes = readSource("src/lib/seo/private-routes.ts");
  const robots = readSource("src/lib/seo/robots.ts");
  assert.match(routes, /PRIVATE_ROUTE_PREFIXES/);
  assert.match(routes, /\/onboarding/);
  assert.match(routes, /\/copilot/);
  assert.match(routes, /\/intelligence/);
  assert.match(routes, /\/auth/);
  assert.match(routes, /\/legal/);
  assert.match(robots, /PRIVATE_ROUTE_PREFIXES/);
  assert.match(robots, /NOINDEX_ROUTES/);
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
  const geo = readSource("src/lib/seo/geo-schema.ts");
  const structured = readSource("src/lib/seo/structured-data.ts");
  assert.match(docs, /docPageGraphJsonLd/);
  assert.match(geo, /techArticleJsonLd|TechArticle/);
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
  assert.match(analytics, /send_page_view:false/);
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

test("metadata sets English language alternates", () => {
  const metadata = readSource("src/lib/seo/metadata.ts");
  assert.match(metadata, /languages:\s*\{/);
  assert.match(metadata, /en:/);
  assert.match(metadata, /"x-default"/);
});

test("Twitter and Open Graph share the same social preview image", () => {
  const metadata = readSource("src/lib/seo/metadata.ts");
  const branding = readSource("src/lib/branding/metadata.ts");
  assert.match(metadata, /resolveTwitterImageUrl/);
  assert.match(metadata, /resolveOpenGraphImageUrl/);
  assert.doesNotMatch(metadata, /linkedinBanner/);
  assert.match(branding, /opengraph-1200x630\.png/);
  assert.doesNotMatch(branding, /linkedin-banner\.png/);
});

test("IndexNow submission and key file are wired for Bing discoverability", () => {
  const indexnow = readSource("src/lib/seo/indexnow.ts");
  const route = readSource("src/app/api/indexnow/route.ts");
  const keyRoute = readSource("src/app/.well-known/[file]/route.ts");
  const envExample = readSource(".env.example");
  const vercel = readSource("vercel.json");
  assert.match(indexnow, /api\.indexnow\.org\/indexnow/);
  assert.match(indexnow, /INDEXNOW_KEY/);
  assert.match(indexnow, /\.well-known\/\$\{key\}\.txt/);
  assert.match(route, /submitIndexNowUrls/);
  assert.match(route, /verifyCronAuthorization/);
  assert.match(keyRoute, /getIndexNowKey/);
  assert.match(envExample, /INDEXNOW_KEY/);
  assert.match(vercel, /\/api\/indexnow/);
});

test("interactive API docs HTML is noindex with canonical to /docs/api", () => {
  const html = readSource("src/lib/api/docs/public-api-docs-html.ts");
  const links = readSource("src/lib/company/company-links.ts");
  assert.match(html, /noindex,\s*nofollow/);
  assert.match(html, /canonical.*\/docs\/api/);
  assert.match(links, /apiDocumentation:\s*"\/docs\/api"/);
});

test("templates hub is indexable and linked from the public footer", () => {
  const hub = readSource("src/app/(marketing)/templates/page.tsx");
  const links = readSource("src/lib/company/company-links.ts");
  const routes = readSource("src/lib/seo/routes.ts");
  assert.match(hub, /createPageMetadataForPath\(MARKETING_ROUTES\.templates\)/);
  assert.match(hub, /TEMPLATE_HUB_ENTRIES/);
  assert.match(links, /templates:\s*"\/templates"/);
  assert.match(links, /label:\s*"Templates"/);
  assert.match(routes, /MARKETING_ROUTES\.templates/);
});

test("webhook routes are blocked in robots policy", () => {
  const routes = readSource("src/lib/seo/private-routes.ts");
  assert.match(routes, /\/webhooks/);
  assert.match(routes, /\/api\//);
});

test("about and contact pages emit allowed structured data types", () => {
  const about = readSource("src/app/(marketing)/about/page.tsx");
  const contact = readSource("src/app/(marketing)/contact/page.tsx");
  const structured = readSource("src/lib/seo/structured-data.ts");
  assert.match(about, /aboutPageJsonLd/);
  assert.match(contact, /contactPageJsonLd/);
  assert.match(structured, /AboutPage/);
  assert.match(structured, /ContactPage/);
  assert.match(structured, /WebPage/);
});

test("public marketing pages use centralized PAGE_SEO metadata registry", () => {
  const marketingDir = "src/app/(marketing)";
  const pages = [
    "page.tsx",
    "features/page.tsx",
    "pricing/page.tsx",
    "enterprise/page.tsx",
    "about/page.tsx",
    "contact/page.tsx",
    "status/page.tsx",
    "integrations/page.tsx",
    "security/page.tsx",
    "privacy/page.tsx",
  ];
  for (const page of pages) {
    const source = readSource(`${marketingDir}/${page}`);
    assert.match(source, /createPageMetadataForPath\(/, `${page} must use registry metadata`);
    assert.doesNotMatch(source, /createMarketingMetadata/, `${page} must not override registry metadata`);
  }
});

test("auth pages use registry metadata with noindex policy", () => {
  for (const page of ["login/page.tsx", "signup/page.tsx", "forgot-password/page.tsx", "reset-password/page.tsx"]) {
    const source = readSource(`src/app/(auth)/${page}`);
    assert.match(source, /createPageMetadataForPath\(/);
    assert.doesNotMatch(source, /createMarketingMetadata/);
  }
  const routes = readSource("src/lib/seo/routes.ts");
  assert.match(routes, /"\/login":/);
  assert.match(routes, /"\/signup":/);
});

test("solution and template pages resolve metadata from PAGE_SEO registry", () => {
  const solutions = readSource("src/app/(marketing)/solutions/[slug]/page.tsx");
  const templates = readSource("src/app/(marketing)/templates/[slug]/page.tsx");
  const routes = readSource("src/lib/seo/routes.ts");
  assert.match(solutions, /createPageMetadataForPath\(content\.path\)/);
  assert.match(templates, /createPageMetadataForPath\(content\.path\)/);
  assert.match(routes, /buildLandingPageSeo/);
  assert.match(routes, /SOLUTION_PAGES/);
  assert.match(routes, /TEMPLATE_PAGES/);
});

test("sitemap validation guards canonical host and private routes", () => {
  const sitemap = readSource("src/lib/seo/sitemap.ts");
  assert.match(sitemap, /validateSitemapEntries/);
  assert.match(sitemap, /PUBLIC_CANONICAL_ORIGIN/);
  assert.match(sitemap, /isPrivateRoute/);
  assert.match(sitemap, /duplicate sitemap URL/);
});

test("middleware preserves apex to www and app marketing to www redirects", () => {
  const middleware = readSource("src/middleware.ts");
  const routing = readSource("src/lib/deployment/middleware-routing.ts");
  assert.match(middleware, /shouldRedirectApexToWww/);
  assert.match(middleware, /shouldRedirectAppMarketingToWww/);
  assert.match(middleware, /X-Robots-Tag/);
  assert.match(middleware, /shouldAttachNoIndexHeader/);
  assert.match(routing, /buildWwwRedirectUrl/);
  assert.match(routing, /shouldAttachNoIndexHeader/);
});

test("auth layout and invite pages are noindex", () => {
  const authLayout = readSource("src/app/(auth)/layout.tsx");
  const invite = readSource("src/app/invite/[token]/page.tsx");
  assert.match(authLayout, /createPrivateAppMetadata/);
  assert.match(invite, /createPrivateAppMetadata/);
});

test("sitemap route validates entries at build time", () => {
  const sitemapRoute = readSource("src/app/sitemap.ts");
  assert.match(sitemapRoute, /validateSitemapEntries/);
});

test("staging hosts are treated as non-indexable preview deployments", () => {
  const metadata = readSource("src/lib/seo/metadata.ts");
  assert.match(metadata, /staging\\.auroranexis\\.com/);
});

test("root layout sets document language to English", () => {
  const layout = readSource("src/app/layout.tsx");
  assert.match(layout, /lang="en"/);
});
