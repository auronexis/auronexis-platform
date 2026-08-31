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
  const critical = [
    "B2B SaaS Pricing for Agency Operations",
    "Client Operations Features for Agencies & MSPs",
    "Enterprise Client Operations for MSPs & Agencies",
    "Integrations for Agency Operations Platforms",
    "Platform Status",
    "Resources for AI Agency & MSP Operations",
  ];
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
  const catalog = readSource("src/lib/billing/catalog.ts");

  // JSON-LD offers are built from public self-serve keys via getPlanByKey (EUR catalog amounts).
  assert.match(schema, /pricingPageJsonLd/);
  assert.match(schema, /function buildPlanOffers/);
  assert.match(schema, /PUBLIC_SELF_SERVE_PLAN_KEYS/);
  assert.match(schema, /getPlanByKey/);
  assert.match(
    plans,
    /PUBLIC_SELF_SERVE_PLAN_KEYS = \["professional", "business", "enterprise"\]/,
  );

  // Canonical public EUR minor-unit prices — structured data must stay aligned.
  const publicEurMajors = {
    professional: 179,
    business: 599,
    enterprise: 1799,
  };

  const publicEurMinors = {
    professional: "17_900",
    business: "59_900",
    enterprise: "179_900",
  };

  for (const [planKey, major] of Object.entries(publicEurMajors)) {
    assert.match(
      catalog,
      new RegExp(
        `productPath: "${planKey}"[\\s\\S]*?visibility: "public"[\\s\\S]*?amountMinor: ${publicEurMinors[planKey]}`,
      ),
      `catalog missing public ${planKey} amountMinor=${publicEurMinors[planKey]} (major ${major})`,
    );
    assert.match(
      plans,
      new RegExp(`key: "${planKey}"[\\s\\S]*?amountMinorFallback:\\s*${publicEurMinors[planKey]}`),
      `plans.ts missing ${planKey} EUR amountMinorFallback ${publicEurMinors[planKey]}`,
    );
  }

  // No FastSpring Starter product; starter PlanKey remains internal entitlement fallback only.
  assert.doesNotMatch(catalog, /productPath:\s*"starter"/);
  assert.doesNotMatch(catalog, /"starter"/);
  assert.match(plans, /key: "starter"/);
  assert.match(plans, /Internal fallback tier/);
  assert.doesNotMatch(
    plans,
    /PUBLIC_SELF_SERVE_PLAN_KEYS = \[[^\]]*starter/,
  );

  // Private FastSpring programs must not enter public offer generation.
  assert.match(catalog, /productPath: "founding-member"[\s\S]*?visibility: "private"/);
  assert.match(catalog, /productPath: "pilot-client"[\s\S]*?visibility: "private"/);
  assert.doesNotMatch(schema, /founding-member|pilot-client|Founding Partner|Pilot Client/);

  // Stale pre-migration EUR literals must not drive structured data.
  assert.doesNotMatch(plans, /currency: "EUR"/);
  assert.doesNotMatch(plans, /priceMonthly: 499\b/);
  assert.doesNotMatch(plans, /priceMonthly: 1499\b/);

  assert.doesNotMatch(schema, /aggregateRating/);
  assert.doesNotMatch(schema, /reviewCount/);
  assert.doesNotMatch(schema, /OfferShippingDetails/);
  assert.doesNotMatch(schema, /shippingDetails\s*:/);
  assert.doesNotMatch(schema, /shippingRate/);
  assert.doesNotMatch(schema, /digitalAccessShippingDetails/);
  assert.doesNotMatch(schema, /itemCondition/);
  assert.doesNotMatch(schema, /NewCondition/);
  assert.doesNotMatch(schema, /"@type":\s*"Product"/);
  assert.match(schema, /MerchantReturnNotPermitted/);
  assert.match(schema, /merchantReturnPolicyJsonLd/);
  assert.match(schema, /pricingPlanProductsJsonLd/);
  assert.match(schema, /SoftwareApplication/);
  assert.match(schema, /LimitedAvailability/);
  assert.match(schema, /BRANDING_ASSETS\.openGraph/);
  assert.match(schema, /priceCurrency: plan\.currency/);
  assert.doesNotMatch(schema, /hasMerchantReturnPolicy\s*:/);
  assert.match(schema, /contactPoint/);
  assert.match(schema, /softwareVersion/);
  // No fabricated public site-search markup without a real search endpoint.
  assert.doesNotMatch(schema, /"@type":\s*"SearchAction"/);
  assert.doesNotMatch(schema, /potentialAction/);
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
  const rootKeyRoute = readSource("src/app/[file]/route.ts");
  const wellKnownKeyRoute = readSource("src/app/.well-known/[file]/route.ts");
  const envExample = readSource(".env.example");
  const vercel = readSource("vercel.json");
  assert.match(indexnow, /api\.indexnow\.org\/indexnow/);
  assert.match(indexnow, /INDEXNOW_KEY/);
  assert.match(indexnow, /buildIndexNowKeyLocation/);
  assert.match(indexnow, /https:\/\/\$\{host\}\/\$\{key\}\.txt/);
  assert.doesNotMatch(indexnow, /keyLocation.*\.well-known/);
  assert.match(indexnow, /listPublicIndexableRoutes/);
  assert.match(route, /submitIndexNowUrls/);
  assert.match(route, /verifyCronAuthorization/);
  assert.match(rootKeyRoute, /getIndexNowKey/);
  assert.match(rootKeyRoute, /\$\{key\}\.txt/);
  assert.match(wellKnownKeyRoute, /getIndexNowKey/);
  assert.match(envExample, /INDEXNOW_KEY/);
  assert.match(vercel, /\/api\/indexnow/);
});

test("IndexNow API route preserves upstream status instead of blanketing 502", () => {
  const route = readSource("src/app/api/indexnow/route.ts");
  assert.match(route, /result\.status/);
  assert.match(route, /502/);
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

test("resources hub is indexable, sitemap-listed, and footer-linked", () => {
  const page = readSource("src/app/(marketing)/resources/page.tsx");
  const links = readSource("src/lib/company/company-links.ts");
  const routes = readSource("src/lib/seo/routes.ts");
  const pillars = readSource("src/lib/seo/resource-pillars.ts");
  assert.match(page, /createPageMetadataForPath/);
  assert.match(page, /RESOURCE_PILLARS/);
  assert.match(links, /resources:\s*"\/resources"/);
  assert.match(links, /label:\s*"Resources"/);
  assert.match(routes, /MARKETING_ROUTES\.resources/);
  assert.match(pillars, /RESOURCE_PILLARS/);
  assert.doesNotMatch(pillars, /AggregateRating/);
  assert.doesNotMatch(pillars, /fake case study/i);
  assert.match(pillars, /not invented metrics/);
});

test("search intent ownership map has unique primary paths", () => {
  const intent = readSource("src/lib/seo/intent-ownership.ts");
  assert.match(intent, /SEARCH_INTENT_CLUSTERS/);
  assert.match(intent, /SEARCH_VOLUME_DATA_NOT_AVAILABLE/);
  assert.match(intent, /primaryPath:\s*MARKETING_ROUTES\.home/);
  assert.match(intent, /primaryPath:\s*SOLUTION_ROUTES\.customerHealthScore/);
  assert.match(intent, /listPrimaryIntentPaths/);
});

test("public SEO and marketing sources have no active legacy billing providers", () => {
  const files = [
    "src/lib/seo/routes.ts",
    "src/lib/seo/structured-data.ts",
    "src/lib/seo/llms-txt.ts",
    "src/lib/seo/entity-graph.ts",
    "src/lib/seo/resource-pillars.ts",
    "src/lib/company/company-schema.ts",
    "src/lib/marketing/content.ts",
  ];
  for (const file of files) {
    const source = readSource(file);
    assert.doesNotMatch(source, /\bStripe\b/, `${file} must not mention Stripe`);
    assert.doesNotMatch(source, /\bPaddle\b/, `${file} must not mention Paddle`);
    assert.doesNotMatch(source, /\bFastSpring\b/, `${file} must not mention FastSpring`);
    assert.doesNotMatch(source, /Merchant of Record|\bMoR\b/, `${file} must not claim MoR`);
  }
});

test("structured data and marketing avoid fake AggregateRating and review markup", () => {
  const schema = readSource("src/lib/company/company-schema.ts");
  const structured = readSource("src/lib/seo/structured-data.ts");
  const geo = readSource("src/lib/seo/geo-schema.ts");
  for (const source of [schema, structured, geo]) {
    assert.doesNotMatch(source, /AggregateRating/);
    assert.doesNotMatch(source, /ratingValue/);
  }
  const testimonials = readSource("src/components/marketing/marketing-testimonials.tsx");
  assert.match(testimonials, /not customer testimonials/);
});

test("operator SEO checklist documents GSC Bing and IndexNow without fabricated metrics", () => {
  const doc = readSource("docs/enterprise-seo-operator-checklist.md");
  assert.match(doc, /www\.auroranexis\.com/);
  assert.match(doc, /sitemap\.xml/);
  assert.match(doc, /INDEXNOW_KEY/);
  assert.match(doc, /SEARCH_VOLUME_DATA_NOT_AVAILABLE/);
  assert.match(doc, /FIELD_CWV_DATA_NOT_AVAILABLE/);
  assert.doesNotMatch(doc, /rank #1|guaranteed ranking/i);
});

test("marketing and docs SEO titles do not cannibalize Security/Compliance/Integrations", () => {
  const routes = readSource("src/lib/seo/routes.ts");
  const registry = readSource("src/lib/docs/registry.ts");
  assert.match(routes, /Platform Security for Agency Operations/);
  assert.match(routes, /Compliance Workflows for Client Operations/);
  assert.match(routes, /Integrations for Agency Operations Platforms/);
  assert.match(registry, /Security documentation/);
  assert.match(registry, /Compliance documentation/);
  assert.match(registry, /Integrations documentation/);
  assert.doesNotMatch(routes, /title:\s*"Security"/);
  assert.doesNotMatch(routes, /title:\s*"Compliance"/);
  assert.doesNotMatch(routes, /title:\s*"Integrations"/);
});

test("feature vs solution incident pages use differentiated titles", () => {
  const feature = readSource("src/lib/seo/feature-content.ts");
  const solution = readSource("src/lib/seo/landing-content.ts");
  assert.match(feature, /title: "Incident management with SLA awareness"/);
  assert.match(solution, /title: "Client portfolio incident response with SLA tracking"/);
});

test("phase 2 authority: homepage logo/testimonials do not reintroduce duplicate H3 defaults", () => {
  const logo = readSource("src/components/marketing/marketing-logo-cloud.tsx");
  const testimonials = readSource("src/components/marketing/marketing-testimonials.tsx");
  const home = readSource("src/app/(marketing)/page.tsx");
  assert.match(logo, /title\?\.trim/);
  assert.match(testimonials, /title\?\.trim/);
  assert.doesNotMatch(logo, /title\s*=\s*"Built for service-led/);
  assert.doesNotMatch(testimonials, /title\s*=\s*"What operations leaders/);
  assert.match(home, /title="Service-led organizations"/);
  assert.match(home, /title="What operations leaders look for"/);
  assert.match(home, /<MarketingLogoCloud items=\{MARKETING_LOGO_CLOUD\} \/>/);
  assert.match(home, /<MarketingTestimonials items=\{MARKETING_TESTIMONIALS\} \/>/);
});

test("phase 2 authority: industry vs use-case titles are differentiated for overlapping ICPs", () => {
  const industry = readSource("src/lib/seo/industry-content.ts");
  const audience = readSource("src/lib/seo/audience-content.ts");
  assert.match(industry, /Marketing sector delivery operations for agencies and brand teams/);
  assert.match(audience, /Client operations for marketing agencies/);
  assert.match(industry, /IT services industry portfolio governance and SLA operations/);
  assert.match(audience, /Operational command center for IT service providers/);
  assert.match(industry, /Professional services industry engagement governance/);
  assert.match(audience, /Delivery operations for consultancies/);
  assert.match(industry, /USE_CASE_ROUTES\.marketingAgencies/);
  assert.match(industry, /USE_CASE_ROUTES\.msps/);
  assert.match(audience, /INDUSTRY_ROUTES\.marketing/);
  assert.match(audience, /INDUSTRY_ROUTES\.it/);
});

test("phase 2 authority: executive dashboard feature vs solution titles do not collide", () => {
  const feature = readSource("src/lib/seo/feature-content.ts");
  const solution = readSource("src/lib/seo/landing-content.ts");
  assert.match(feature, /title: "Portfolio KPI dashboards for operations teams"/);
  assert.match(solution, /title: "Executive dashboard for agency operations"/);
  assert.match(feature, /href: SOLUTION_ROUTES\.executiveDashboard/);
});

test("phase 2 authority: intent map owns persona and dashboard clusters with unique primaries", () => {
  const intent = readSource("src/lib/seo/intent-ownership.ts");
  assert.match(intent, /id: "msp-operations-persona"/);
  assert.match(intent, /id: "marketing-agency-persona"/);
  assert.match(intent, /id: "executive-portfolio-dashboard"/);
  assert.match(intent, /id: "resources-authority-hub"/);
  assert.match(intent, /primaryPath: USE_CASE_ROUTES\.msps/);
  assert.match(intent, /primaryPath: SOLUTION_ROUTES\.executiveDashboard/);
  const primaries = [...intent.matchAll(/primaryPath:\s*([A-Z][A-Z0-9_]*\.[a-zA-Z0-9_]+)/g)].map(
    (m) => m[1],
  );
  assert.ok(primaries.length >= 14, `expected >=14 primaryPath entries, got ${primaries.length}`);
  assert.equal(new Set(primaries).size, primaries.length, "duplicate primaryPath owners in intent map");
});

test("phase 2 authority: nav and footer expose Use cases without company-section duplication", () => {
  const nav = readSource("src/lib/marketing/content.ts");
  const links = readSource("src/lib/company/company-links.ts");
  assert.match(nav, /label: "Use cases"/);
  assert.match(links, /label: "Use cases", href: MARKETING_ROUTES\.useCases/);
  const companyMatch = links.match(/company:\s*\[([\s\S]*?)\],\s*\n\} as const/);
  assert.ok(companyMatch, "FOOTER_SECTIONS.company block not found");
  assert.doesNotMatch(companyMatch[1], /Use cases/);
});

test("canonical docs and status URLs stay on www — no separate docs host", () => {
  const links = readSource("src/lib/company/company-links.ts");
  assert.match(links, /docs: "https:\/\/www\.auroranexis\.com\/docs"/);
  assert.match(links, /status: "https:\/\/www\.auroranexis\.com\/status"/);
  assert.doesNotMatch(links, /docs\.auroranexis\.com/);
  assert.doesNotMatch(links, /status\.auroranexis\.com/);
});

test("app host redirects robots.txt and sitemap.xml to www via middleware matcher", () => {
  const middleware = readSource("src/middleware.ts");
  const routing = readSource("src/lib/deployment/middleware-routing.ts");
  assert.doesNotMatch(middleware, /robots\.txt\|sitemap\.xml/);
  assert.match(routing, /shouldRedirectAppMarketingToWww/);
  assert.match(routing, /robots\.txt and sitemap\.xml/);
});

test("pricing schema remains SoftwareApplication SaaS with EUR — no Product merchant nodes", () => {
  const schema = readSource("src/lib/company/company-schema.ts");
  assert.match(schema, /SoftwareApplication/);
  assert.match(schema, /priceCurrency: plan\.currency/);
  assert.doesNotMatch(schema, /"@type":\s*"Product"/);
  assert.doesNotMatch(schema, /priceCurrency:\s*"USD"/);
  assert.doesNotMatch(schema, /OfferShippingDetails|shippingDetails\s*:/);
});

test("public marketing slug routes set dynamicParams false to prevent soft-404", () => {
  const files = [
    "src/app/docs/[slug]/page.tsx",
    "src/app/(marketing)/features/[slug]/page.tsx",
    "src/app/(marketing)/solutions/[slug]/page.tsx",
    "src/app/(marketing)/templates/[slug]/page.tsx",
    "src/app/(marketing)/use-cases/[slug]/page.tsx",
    "src/app/(marketing)/industries/[slug]/page.tsx",
  ];
  for (const file of files) {
    const source = readSource(file);
    assert.match(source, /export const dynamicParams = false/, `${file} must disable unknown dynamic params`);
    assert.match(source, /generateStaticParams/, `${file} must keep static params`);
  }
});

test("integrations catalog does not bury live Teams or Enterprise API under Coming soon", () => {
  const catalog = readSource("src/lib/marketing/integrations-catalog.ts");
  assert.match(catalog, /id: "teams"/);
  assert.match(catalog, /id: "api-access"/);
  assert.match(catalog, /id: "zapier"/);
  // Teams + API must not be sectioned as coming_soon
  assert.doesNotMatch(
    catalog,
    /id: "teams"[\s\S]{0,220}section: "coming_soon"/,
    "Microsoft Teams must not be Coming soon when live delivery exists",
  );
  assert.doesNotMatch(
    catalog,
    /id: "api-access"[\s\S]{0,220}section: "coming_soon"/,
    "API Access must not be Coming soon when REST API exists",
  );
  assert.match(catalog, /id: "teams"[\s\S]{0,220}section: "available"/);
  assert.match(catalog, /id: "api-access"[\s\S]{0,220}section: "available"/);
  assert.match(catalog, /id: "zapier"[\s\S]{0,220}section: "coming_soon"/);
});

test("features/integrations copy does not overclaim production CRM sync replication", () => {
  const feature = readSource("src/lib/seo/feature-content.ts");
  assert.match(feature, /v1 sync as scaffolding/);
  assert.match(feature, /not guaranteed CRM\/ticketing replication/);
  assert.doesNotMatch(
    feature,
    /Operational records stay aligned with your CRM, ticketing, and productivity tools without constant manual export and import/,
  );
});

test("middleware hard-404s unknown public marketing/docs slugs", () => {
  const middleware = readSource("src/middleware.ts");
  const allowlist = readSource("src/lib/seo/public-dynamic-slug-allowlist.ts");
  assert.match(middleware, /isUnknownPublicDynamicSlugPath/);
  assert.match(middleware, /status:\s*404/);
  assert.match(allowlist, /isUnknownPublicDynamicSlugPath/);
  assert.match(allowlist, /\/features\//);
  assert.match(allowlist, /\/docs\//);
  assert.match(allowlist, /release-notes/);
  assert.match(allowlist, /integrations/);
});

test("session middleware hard-404s unknown non-private paths instead of login redirect", () => {
  const sessionMw = readSource("src/lib/supabase/middleware.ts");
  assert.match(sessionMw, /isPrivateRoute/);
  assert.match(sessionMw, /hardNotFoundResponse/);
  assert.match(sessionMw, /status:\s*404/);
  // Login redirect must remain for known private app surfaces only.
  assert.match(
    sessionMw,
    /if\s*\(\s*!isPrivateRoute\(pathname\)\s*\)\s*\{[\s\S]*?hardNotFoundResponse\(\)/,
  );
  assert.match(sessionMw, /buildAppLoginUrl/);
});
