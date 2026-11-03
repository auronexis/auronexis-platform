/**
 * The founder's LinkedIn profile is linked from structured data and visible bylines, so search
 * engines connect "István-Tamás Schneller", Auroranexis and the profile.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/founder-linkedin-sameas.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const { COMPANY_INFORMATION } = await import("@/lib/company/company-information");
const { organizationJsonLd } = await import("@/lib/company/company-schema");
const { guidePageGraphJsonLd } = await import("@/lib/seo/geo-schema");
const { GUIDES_AUTHOR } = await import("@/lib/seo/guides-content");

const LINKEDIN = "https://www.linkedin.com/in/istvan-tamas-schneller-75b56941a/";

describe("founder LinkedIn", () => {
  it("is a single source of truth in company information", () => {
    assert.equal(COMPANY_INFORMATION.founderLinkedInUrl, LINKEDIN);
  });

  it("is the founder's sameAs in the Organization schema", () => {
    const org = organizationJsonLd();
    assert.equal(org.founder.name, "István-Tamás Schneller");
    assert.deepEqual(org.founder.sameAs, [LINKEDIN]);
  });

  it("is the guide author's sameAs and visible byline link", () => {
    const graph = guidePageGraphJsonLd({
      title: "t",
      description: "d",
      path: "/guides/x",
      published: "2026-10-01",
      updated: "2026-10-01",
      author: GUIDES_AUTHOR,
      faq: [],
      breadcrumbs: [{ name: "Home", path: "/" }],
    });
    const article = graph["@graph"].find((node) => node["@type"] === "Article");
    assert.deepEqual(article.author.sameAs, [LINKEDIN]);
    assert.match(readSource("src/components/marketing/guide-page-view.tsx"), /GUIDES_AUTHOR\.linkedInUrl/);
    assert.match(readSource("src/app/(marketing)/about/page.tsx"), /founderLinkedInUrl/);
  });
});
