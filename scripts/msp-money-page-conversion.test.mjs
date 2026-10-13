import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

function extractMspsBlock(audience) {
  const start = audience.indexOf("msps: buildLandingPage");
  const end = audience.indexOf("consultancies: buildLandingPage", start + 1);
  assert.ok(start >= 0 && end > start, "msps landing block not found");
  return audience.slice(start, end);
}

test("MSP money page owns conversion CTA hierarchy and demo deep link", () => {
  const audience = readSource("src/lib/seo/audience-content.ts");
  const block = extractMspsBlock(audience);
  assert.match(block, /title: "MSP Client Portfolio Management Software"/);
  assert.match(block, /primaryCta: "bookMspDemo"/);
  assert.match(block, /secondaryCta: "comparePlans"/);
  assert.match(block, /tertiaryCta: "startFreeTrial"/);
  assert.match(block, /href: MARKETING_ROUTES\.pricing/);
  assert.match(block, /href: "\/signup"/);
  assert.match(block, /href: MARKETING_ROUTES\.pilotProgram/);
  assert.match(block, /Book an MSP demo/);
  assert.match(block, /Business or Enterprise/);
  assert.match(block, /up to 25 clients/);
  assert.match(block, /up to 100 clients/);
  assert.doesNotMatch(block, /primaryCta: "startFreeTrial"/);
  assert.doesNotMatch(block, /SOC 2|ISO 27001|5-star|testimonial|G2|Capterra|guaranteed ROI/i);

  const cta = readSource("src/lib/marketing/cta.ts");
  assert.match(cta, /bookMspDemo:\s*\{/);
  assert.match(cta, /label: "Book an MSP demo"/);
  assert.match(cta, /href: "\/contact#demo"/);
  assert.match(cta, /analyticsEvent: "demo_requested"/);

  const contact = readSource("src/app/(marketing)/contact/page.tsx");
  assert.match(contact, /id="demo"/);
  assert.match(contact, /DemoBookingForm/);
  assert.match(contact, /title="Book a demo"/);
});

test("MSP money page preserves indexable canonical path and intent ownership", () => {
  const audience = readSource("src/lib/seo/audience-content.ts");
  const block = extractMspsBlock(audience);
  assert.match(block, /pathPrefix: "\/use-cases"/);
  assert.match(block, /slug: "msps"/);
  assert.match(block, /metaDescription:\s*\n\s*"MSP client portfolio management software/);

  const links = readSource("src/lib/company/company-links.ts");
  assert.match(links, /msps: "\/use-cases\/msps"/);

  const intent = readSource("src/lib/seo/intent-ownership.ts");
  assert.match(intent, /id: "msp-operations-persona"/);
  assert.match(intent, /primaryPath: USE_CASE_ROUTES\.msps/);

  const allowlist = readSource("src/lib/seo/public-dynamic-slug-allowlist.ts");
  assert.match(allowlist, /"msps"/);
});
