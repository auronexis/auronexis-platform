/**
 * Pricing structured-data regression — SaaS SoftwareApplication, EUR catalog alignment.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("pricing page emits SoftwareApplication graph without Product merchant nodes", () => {
  const page = readSource("src/app/(marketing)/pricing/page.tsx");
  const geo = readSource("src/lib/seo/geo-schema.ts");
  const schema = readSource("src/lib/company/company-schema.ts");

  assert.match(page, /pricingGraphJsonLd\(pricingPageJsonLd\(\)\)/);
  assert.doesNotMatch(page, /pricingPlanProductsJsonLd/);
  assert.doesNotMatch(page, /merchantReturnPolicyJsonLd/);
  assert.match(geo, /about: \{ "@id": GRAPH_ENTITY_IDS\.softwareApplication \}/);
  assert.match(geo, /mainEntity: \{ "@id": GRAPH_ENTITY_IDS\.softwareApplication \}/);
  assert.match(schema, /pricingPageJsonLd\(\) \{[\s\S]*softwareApplicationJsonLd/);
  assert.match(schema, /pricingPlanProductsJsonLd\(\): Record<string, unknown>\[\] \{\s*return \[\];/);
});

test("offers derive EUR prices from catalog-backed plan.currency with no USD drift", () => {
  const schema = readSource("src/lib/company/company-schema.ts");
  const plans = readSource("src/lib/billing/plans.ts");
  const priceCatalog = readSource("src/lib/billing/price-catalog.ts");
  const publicPricing = readSource("src/lib/marketing/public-pricing.ts");

  assert.match(priceCatalog, /PRIMARY_BILLING_CURRENCY: CatalogBillingCurrency = "EUR"/);
  assert.match(priceCatalog, /amountMinor: 17_900/);
  assert.match(priceCatalog, /amountMinor: 59_900/);
  assert.match(priceCatalog, /amountMinor: 179_900/);
  assert.match(plans, /currency: catalog\?\.currency \?\? PRIMARY_BILLING_CURRENCY/);
  assert.match(schema, /priceCurrency: plan\.currency/);
  assert.match(schema, /price: String\(plan\.priceMonthly\)/);
  assert.doesNotMatch(schema, /priceCurrency:\s*"USD"/);
  assert.doesNotMatch(schema, /"USD"/);
  assert.match(publicPricing, /PRIMARY_BILLING_CURRENCY/);
  assert.match(publicPricing, /getCatalogDisplayPrices/);
});

test("SaaS offers forbid invented shipping, ratings, and physical NewCondition", () => {
  const schema = readSource("src/lib/company/company-schema.ts");
  const geo = readSource("src/lib/seo/geo-schema.ts");

  for (const source of [schema, geo]) {
    assert.doesNotMatch(source, /shippingDetails\s*:/);
    assert.doesNotMatch(source, /OfferShippingDetails/);
    assert.doesNotMatch(source, /AggregateRating/);
    assert.doesNotMatch(source, /ratingValue/);
  }
  assert.doesNotMatch(schema, /itemCondition/);
  assert.doesNotMatch(schema, /NewCondition/);
  assert.doesNotMatch(schema, /digitalAccessShippingDetails/);
  assert.doesNotMatch(schema, /hasMerchantReturnPolicy\s*:/);
});

test("enterprise offer availability matches Contact sales CTA", () => {
  const schema = readSource("src/lib/company/company-schema.ts");
  const cta = readSource("src/components/marketing/marketing-plan-cta.tsx");

  assert.match(cta, /planName === "Enterprise"/);
  assert.match(cta, /Contact sales/);
  assert.match(schema, /LimitedAvailability/);
  assert.match(schema, /plan\.key === "enterprise"/);
  assert.match(schema, /MARKETING_ROUTES\.contact/);
});

test("software application image uses existing public OG asset", () => {
  const schema = readSource("src/lib/company/company-schema.ts");
  const branding = readSource("src/lib/branding/assets.ts");

  assert.match(branding, /openGraph: "\/branding\/opengraph-1200x630\.png"/);
  assert.match(schema, /image: absoluteAsset\(BRANDING_ASSETS\.openGraph\)/);
});

test("pricing structured data has no active legacy billing providers", () => {
  const schema = readSource("src/lib/company/company-schema.ts");
  assert.doesNotMatch(schema, /\bStripe\b/);
  assert.doesNotMatch(schema, /\bPaddle\b/);
  assert.doesNotMatch(schema, /\bFastSpring\b/);
  assert.match(schema, /Mollie/);
});
