import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

test("entity graph defines nine canonical capabilities with stable @id fragments", () => {
  const entityGraph = readSource("src/lib/seo/entity-graph.ts");
  assert.match(entityGraph, /CANONICAL_CAPABILITIES/);
  assert.match(entityGraph, /GRAPH_ENTITY_IDS/);
  assert.match(entityGraph, /ai-operations-platform/);
  assert.match(entityGraph, /executive-reporting/);
  assert.match(entityGraph, /client-portal/);
  assert.match(entityGraph, /knowledge-base/);
  const capabilityCount = (entityGraph.match(/id: "/g) ?? []).length;
  assert.ok(capabilityCount >= 15, "expected capabilities and solutions in entity graph");
});

test("company schema links organization product and software application by @id", () => {
  const schema = readSource("src/lib/company/company-schema.ts");
  assert.match(schema, /GRAPH_ENTITY_IDS\.organization/);
  assert.match(schema, /GRAPH_ENTITY_IDS\.softwareApplication/);
  assert.match(schema, /GRAPH_ENTITY_IDS\.product/);
  assert.match(schema, /knowsAbout: capabilityKnowsAbout/);
  assert.match(schema, /featureList: capabilityKnowsAbout/);
  assert.match(schema, /isRelatedTo: \{ "@id": GRAPH_ENTITY_IDS\.softwareApplication \}/);
});

test("geo schema builders use linked @graph pattern", () => {
  const geo = readSource("src/lib/seo/geo-schema.ts");
  for (const fn of [
    "landingPageGraphJsonLd",
    "solutionPageGraphJsonLd",
    "collectionPageGraphJsonLd",
    "docPageGraphJsonLd",
    "homePageGraphJsonLd",
    "pricingGraphJsonLd",
  ]) {
    assert.match(geo, new RegExp(`export function ${fn}`));
  }
  assert.match(geo, /"@graph": graph/);
  assert.match(geo, /GRAPH_ENTITY_IDS\.website/);
});

test("landing and solution views emit graph JSON-LD with GEO definition sections", () => {
  const landing = readSource("src/components/marketing/landing-page-view.tsx");
  const solution = readSource("src/components/marketing/solution-page-view.tsx");
  assert.match(landing, /landingPageGraphJsonLd/);
  assert.match(landing, /title="Definition"/);
  assert.match(landing, /<dfn/);
  assert.match(solution, /solutionPageGraphJsonLd/);
  assert.match(solution, /title="Definition"/);
});

test("homepage and pricing use unified knowledge graph builders", () => {
  const home = readSource("src/app/(marketing)/page.tsx");
  const pricing = readSource("src/app/(marketing)/pricing/page.tsx");
  assert.match(home, /homePageGraphJsonLd/);
  assert.doesNotMatch(home, /faqJsonLd\(FAQ_ITEMS\)/);
  assert.match(pricing, /pricingGraphJsonLd/);
});

test("security docs and hub pages expose schema aligned with visible content", () => {
  const security = readSource("src/app/(marketing)/security/page.tsx");
  const docSlug = readSource("src/app/docs/[slug]/page.tsx");
  const docsHub = readSource("src/app/docs/page.tsx");
  const features = readSource("src/app/(marketing)/features/page.tsx");
  const faq = readSource("src/app/(marketing)/faq/page.tsx");
  const hub = readSource("src/components/marketing/landing-hub-view.tsx");

  assert.match(security, /faqJsonLd\(SECURITY_FAQ\)/);
  assert.match(security, /MarketingFaq items={SECURITY_FAQ}/);
  assert.match(docSlug, /docPageGraphJsonLd/);
  assert.match(docsHub, /collectionPageGraphJsonLd/);
  assert.match(features, /collectionPageGraphJsonLd/);
  assert.match(faq, /collectionPageGraphJsonLd/);
  assert.match(faq, /faqJsonLd\(allFaqItems\)/);
  assert.match(hub, /collectionPageGraphJsonLd/);
  assert.match(hub, /hubPath/);
});

test("documentation cross-links map product marketing surfaces", () => {
  const crossLinks = readSource("src/lib/docs/marketing-cross-links.ts");
  const layout = readSource("src/components/docs/doc-page-layout.tsx");
  assert.match(crossLinks, /getDocMarketingLinks/);
  assert.match(crossLinks, /reports/);
  assert.match(crossLinks, /client-portal/);
  assert.match(layout, /getDocMarketingLinks/);
  assert.match(layout, /Related product pages/);
});

test("llms.txt route publishes factual crawler guidance", () => {
  const route = readSource("src/app/llms.txt/route.ts");
  const llms = readSource("src/lib/seo/llms-txt.ts");
  assert.match(route, /buildLlmsTxt/);
  assert.match(llms, /CANONICAL_CAPABILITIES/);
  assert.match(llms, /Accuracy policy/);
  assert.match(llms, /Do not claim SOC 2/);
  assert.match(route, /text\/plain/);
});

test("seo index exports entity graph and geo schema modules", () => {
  const index = readSource("src/lib/seo/index.ts");
  assert.match(index, /entity-graph/);
  assert.match(index, /geo-schema/);
  assert.match(index, /CANONICAL_CAPABILITIES/);
  assert.match(index, /landingPageGraphJsonLd/);
});

test("release notes use PAGE_SEO registry metadata", () => {
  const releaseNotes = readSource("src/app/docs/release-notes/page.tsx");
  assert.match(releaseNotes, /createPageMetadataForPath\("\/docs\/release-notes"\)/);
});

test("no hidden FAQ schema on pages without visible FAQ sections", () => {
  const pricing = readSource("src/app/(marketing)/pricing/page.tsx");
  const features = readSource("src/app/(marketing)/features/page.tsx");
  assert.doesNotMatch(pricing, /faqJsonLd/);
  assert.doesNotMatch(features, /faqJsonLd/);
});
