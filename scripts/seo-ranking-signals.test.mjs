/**
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/seo-ranking-signals.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const { buildSitemapEntries } = await import("../src/lib/seo/sitemap.ts");
const { contentLastModified, CONTENT_DATE_RULES, DEFAULT_CONTENT_DATE } = await import(
  "../src/lib/seo/content-dates.ts"
);
const { organizationJsonLd, websiteJsonLd } = await import("../src/lib/company/company-schema.ts");
const { FOOTER_SECTIONS, INDUSTRY_ROUTES, SOLUTION_ROUTES, TEMPLATE_ROUTES } = await import(
  "../src/lib/company/company-links.ts"
);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

test("every sitemap URL carries a real editorial lastmod date (never in the future)", () => {
  const entries = buildSitemapEntries();
  assert.ok(entries.length > 50);
  const today = new Date().toISOString().slice(0, 10);
  for (const entry of entries) {
    assert.match(String(entry.lastModified), ISO_DATE, entry.url);
    assert.ok(String(entry.lastModified) <= today, `lastmod in the future: ${entry.url}`);
  }
});

test("content date rules are valid ISO dates and legal docs keep their own history", () => {
  for (const rule of CONTENT_DATE_RULES) assert.match(rule.date, ISO_DATE);
  assert.match(DEFAULT_CONTENT_DATE, ISO_DATE);
  assert.equal(contentLastModified("/data-processing-agreement"), "2026-08-30");
  assert.notEqual(contentLastModified("/security-policy"), contentLastModified("/security"));
  assert.doesNotMatch(readSource("src/lib/seo/content-dates.ts"), /(=|return)\s*new Date\(/);
});

test("brand entity uses the product name so Google shows 'Auroranexis'", () => {
  const org = organizationJsonLd();
  const site = websiteJsonLd();
  assert.equal(org.name, "Auroranexis");
  assert.equal(org.legalName, "Auroranexis AI Solutions");
  assert.equal(site.name, "Auroranexis");
  assert.match(org.description, /client operations software for service businesses/);
});

test("favicon shows the Auroranexis mark, not the old 'N' placeholder", () => {
  const svg = readSource("public/favicon.svg");
  assert.doesNotMatch(svg, /M8 22V10h3\.2l4\.8 7\.5V10H19v12h-3\.2/);
  assert.match(svg, /data:image\/png;base64,/);
});

test("footer links every solution, industry and template page", () => {
  const hrefs = new Set(
    [...FOOTER_SECTIONS.product, ...FOOTER_SECTIONS.solutions, ...FOOTER_SECTIONS.industries, ...FOOTER_SECTIONS.resources].map(
      (l) => l.href,
    ),
  );
  for (const href of [...Object.values(SOLUTION_ROUTES), ...Object.values(INDUSTRY_ROUTES), ...Object.values(TEMPLATE_ROUTES)]) {
    assert.ok(hrefs.has(href), `footer missing ${href}`);
  }
  const footer = readSource("src/components/layout/site-footer.tsx");
  for (const title of ["Solutions", "Industries", "Resources"]) {
    assert.match(footer, new RegExp(`FooterLinkColumn dark title="${title}"`));
  }
});
