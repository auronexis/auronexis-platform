import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

function extractQuotedField(source, field) {
  const pattern = new RegExp(`${field}:\\s*"([^"]+)"`, "g");
  return [...source.matchAll(pattern)].map((match) => match[1]);
}

function assertUnique(values, label) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  assert.equal(duplicates.length, 0, `${label} duplicates: ${[...new Set(duplicates)].join(" | ")}`);
}

test("priority page owns automated client reporting intent in title, H1 source, and meta", () => {
  const solution = readSource("src/lib/seo/landing-content.ts");
  assert.match(solution, /slug: "ai-reporting"/);
  assert.match(solution, /title: "Automated client reporting for agencies and MSPs"/);
  assert.match(solution, /definitionTerm: "Automated client reporting"/);
  assert.match(
    solution,
    /metaDescription:\s*\n\s*"Automated client reporting for agencies and MSPs:/,
  );
  assert.match(solution, /What is automated client reporting in Auroranexis\?/);
  assert.match(solution, /Is AI required for automated client reporting\?/);
  assert.doesNotMatch(solution, /SOC 2|ISO 27001 certified|5-star|aggregateRating/i);
});

test("supporting report pages do not use the primary solution H1", () => {
  const feature = readSource("src/lib/seo/feature-content.ts");
  assert.match(feature, /title: "Report templates, schedules, and publication workflows"/);
  assert.match(feature, /title: "AI-assisted executive reports for leadership briefings"/);
  assert.doesNotMatch(feature, /title: "Automated client reporting for agencies and MSPs"/);
  assert.match(feature, /href: SOLUTION_ROUTES\.aiReporting/);
});

test("GSC cluster primaries A–E are unique in the intent map", () => {
  const intent = readSource("src/lib/seo/intent-ownership.ts");
  assert.match(intent, /id: "executive-client-reporting"/);
  assert.match(intent, /label: "Automated client reporting"/);
  assert.match(intent, /primaryPath: SOLUTION_ROUTES\.aiReporting/);
  assert.match(intent, /id: "agency-operations-automation"/);
  assert.match(intent, /primaryPath: FEATURE_ROUTES\.automation/);
  assert.match(intent, /id: "portfolio-profitability-reporting"/);
  assert.match(intent, /primaryPath: FEATURE_ROUTES\.profitability/);
  assert.match(intent, /id: "msp-operations-persona"/);
  assert.match(intent, /primaryPath: USE_CASE_ROUTES\.msps/);
  assert.match(intent, /id: "incident-management"/);
  assert.match(intent, /primaryPath: SOLUTION_ROUTES\.incidentManagement/);

  const primaries = [...intent.matchAll(/primaryPath:\s*([A-Z][A-Z0-9_]*\.[a-zA-Z0-9_]+)/g)].map(
    (match) => match[1],
  );
  assertUnique(primaries, "intent primaryPath");
});

test("solution and feature page titles used as metadata remain unique", () => {
  const files = [
    "src/lib/seo/landing-content.ts",
    "src/lib/seo/feature-content.ts",
    "src/lib/seo/audience-content.ts",
    "src/lib/seo/industry-content.ts",
    "src/lib/seo/routes.ts",
  ];
  const titles = [];
  const metas = [];
  for (const file of files) {
    const source = readSource(file);
    if (file.endsWith("landing-content.ts") || file.endsWith("feature-content.ts") || file.endsWith("audience-content.ts") || file.endsWith("industry-content.ts")) {
      titles.push(
        ...[...source.matchAll(/eyebrow:[\s\S]*?\n\s*title: "([^"]+)"/g)].map((match) => match[1]),
      );
      metas.push(...extractQuotedField(source, "metaDescription"));
    }
    if (file.endsWith("routes.ts")) {
      titles.push(...extractQuotedField(source, "title"));
      // STATIC_PAGE_SEO uses `description` as meta description.
      metas.push(
        ...[...source.matchAll(/title:[\s\S]*?description:\s*\n?\s*"([^"]+)"/g)].map((match) => match[1]),
      );
    }
  }
  assert.ok(titles.includes("Automated client reporting for agencies and MSPs"));
  assertUnique(titles, "public page title");
  assertUnique(metas.filter(Boolean), "meta description");
});

test("homepage and hubs link to automated client reporting with descriptive anchors", () => {
  const home = readSource("src/app/(marketing)/page.tsx");
  const features = readSource("src/app/(marketing)/features/page.tsx");
  const solutions = readSource("src/app/(marketing)/solutions/page.tsx");
  const marketing = readSource("src/lib/marketing/content.ts");
  assert.match(home, /Automated client reporting/);
  assert.match(home, /href="\/solutions\/ai-reporting"/);
  assert.match(home, /Incident management with SLA tracking/);
  assert.match(home, /MSP portfolio operations/);
  assert.match(features, /Automated client reporting/);
  assert.match(solutions, /automated client reporting/);
  assert.match(marketing, /ctaHref: "\/solutions\/ai-reporting"/);
});

test("feature JSON-LD does not mint extra SoftwareApplication nodes", () => {
  const geo = readSource("src/lib/seo/geo-schema.ts");
  assert.match(geo, /"@type": "DefinedTerm"/);
  const landingAbout = geo.slice(geo.indexOf("function landingAboutEntity"), geo.indexOf("landingPageGraphJsonLd"));
  assert.doesNotMatch(landingAbout, /SoftwareApplication/);
  assert.match(geo, /faqPage\(content\.faq\)/);
  assert.doesNotMatch(geo, /AggregateRating|ratingValue/);
});

test("metadata omits sitewide keyword stuffing and keeps www canonicals", () => {
  const metadata = readSource("src/lib/seo/metadata.ts");
  const seo = readSource("src/lib/company/company-seo.ts");
  assert.doesNotMatch(metadata, /DEFAULT_KEYWORDS/);
  assert.match(metadata, /canonical: url\.toString\(\)/);
  assert.match(seo, /PUBLIC_CANONICAL_ORIGIN/);
  assert.doesNotMatch(metadata, /localhost:3000/);
  assert.doesNotMatch(seo, /canonical.*app\.auroranexis/);
});

test("private surfaces stay noindex and out of sitemap helpers", () => {
  const privateRoutes = readSource("src/lib/seo/private-routes.ts");
  const catalog = readSource("src/lib/seo/route-catalog.ts");
  const sitemap = readSource("src/lib/seo/sitemap.ts");
  const robots = readSource("src/lib/seo/robots.ts");
  for (const path of ["/dashboard", "/login", "/signup", "/client-portal", "/api/"]) {
    assert.match(privateRoutes, new RegExp(path.replace("/", "\\/")));
  }
  assert.match(catalog, /isIndexablePublicRoute/);
  assert.match(sitemap, /isIndexablePublicRoute/);
  assert.match(sitemap, /lastmod is omitted/);
  assert.doesNotMatch(sitemap, /lastModified:\s*new Date/);
  assert.match(robots, /NOINDEX_ROUTES/);
});

test("llms.txt and entity graph point reporting capability at the solution URL", () => {
  const llms = readSource("src/lib/seo/llms-txt.ts");
  const entity = readSource("src/lib/seo/entity-graph.ts");
  assert.match(llms, /Automated client reporting: \$\{base\}\$\{SOLUTION_ROUTES\.aiReporting\}/);
  assert.doesNotMatch(llms, /\/dashboard/);
  assert.match(entity, /name: "Automated Client Reporting"/);
  assert.match(entity, /path: SOLUTION_ROUTES\.aiReporting/);
});
