/**
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/guides-content.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const { GUIDES, GUIDES_HUB } = await import("@/lib/seo/guides-content");
const { GUIDE_ROUTES, PUBLIC_SITEMAP_ROUTES } = await import("@/lib/company/company-links");
const { PAGE_SEO } = await import("@/lib/seo/routes");
const { contentLastModified } = await import("@/lib/seo/content-dates");
const { isUnknownPublicDynamicSlugPath } = await import("@/lib/seo/public-dynamic-slug-allowlist");

test("every guide route has content, and every guide has a route", () => {
  const routes = new Set(Object.values(GUIDE_ROUTES));
  assert.deepEqual(new Set(GUIDES.map((g) => g.path)), routes);
  for (const guide of GUIDES) {
    assert.equal(guide.path, `/guides/${guide.slug}`);
  }
});

test("guides are public, in the sitemap list, and not hard-404ed by middleware", () => {
  for (const guide of GUIDES) {
    assert.ok(PUBLIC_SITEMAP_ROUTES.includes(guide.path), guide.path);
    assert.equal(isUnknownPublicDynamicSlugPath(guide.path), false, guide.path);
  }
  assert.ok(PUBLIC_SITEMAP_ROUTES.includes(GUIDES_HUB.path));
  assert.equal(isUnknownPublicDynamicSlugPath("/guides/not-a-guide"), true);
});

test("titles and descriptions fit search result limits", () => {
  for (const entry of [GUIDES_HUB, ...GUIDES]) {
    assert.ok(`${entry.seoTitle} | Auroranexis`.length <= 60, `${entry.seoTitle} is too long`);
    assert.ok(entry.description.length <= 155, `${entry.path} description is ${entry.description.length} chars`);
    assert.deepEqual(PAGE_SEO[entry.path], { title: entry.seoTitle, description: entry.description });
  }
});

test("sitemap lastmod matches each guide's updated date", () => {
  for (const guide of GUIDES) {
    assert.equal(contentLastModified(guide.path), guide.updated, guide.path);
  }
});

test("guides make no certification or invented-proof claims", () => {
  const text = readSource("src/lib/seo/guides-content.ts").toLowerCase();
  for (const banned of ["certified", "certification", "guarantee", "testimonial", "case study", "studies show", "% of agencies", "% of msps"]) {
    assert.ok(!text.includes(banned), `contains "${banned}"`);
  }
});

test("each guide is substantial and has an FAQ", () => {
  for (const guide of GUIDES) {
    const words = JSON.stringify(guide).split(/\s+/).length;
    assert.ok(words > 900, `${guide.slug} has only ${words} words`);
    assert.ok(guide.faq.length >= 3, guide.slug);
  }
});
