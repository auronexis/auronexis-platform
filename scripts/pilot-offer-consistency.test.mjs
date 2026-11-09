/**
 * The pilot offer is described in many places: the pilot page, the homepage, guide pages,
 * page metadata, the Offer structured data, llms.txt and two FAQs. They must all make the same
 * promise, so they read it from src/lib/marketing/pilot-offer.ts.
 *
 * These tests check the generated output (metadata, JSON-LD, llms.txt, FAQ answers), not the
 * source text, so a rewording in pilot-offer.ts cannot leave one of them behind.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/pilot-offer-consistency.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const { PILOT_OFFER, PILOT_OFFER_INCLUDES_SENTENCE } = await import("@/lib/marketing/pilot-offer");
const { pilotProgramJsonLd } = await import("@/lib/company/company-schema");
const { buildLlmsTxt } = await import("@/lib/seo/llms-txt");
const { PAGE_SEO } = await import("@/lib/seo/routes");
const { FAQ_ALL_ITEMS } = await import("@/lib/marketing/faq-content");
const { FAQ_ITEMS, PILOT_PROGRAM } = await import("@/lib/marketing/content");

const pilotFaqAnswers = [...FAQ_ALL_ITEMS, ...FAQ_ITEMS]
  .filter((item) => /pilot program/i.test(item.question))
  .map((item) => item.answer);

describe("pilot offer wording", () => {
  it("states the three key promises once, in the shared module", () => {
    assert.match(PILOT_OFFER.includes, /guided workspace setup with your own clients/);
    assert.match(PILOT_OFFER.includes, /weekly written check-ins/);
    assert.match(PILOT_OFFER.includes, /pilot terms agreed in writing/);
    assert.equal(PILOT_OFFER.applyTerms, "Applying is free and non-binding.");
    assert.equal(PILOT_OFFER_INCLUDES_SENTENCE.charAt(0), "G");
  });

  it("uses the shared wording in the Offer structured data", () => {
    const offer = pilotProgramJsonLd();
    assert.equal(offer["@type"], "Offer");
    assert.ok(offer.description.includes(PILOT_OFFER.includes));
    assert.ok(offer.description.includes(PILOT_OFFER.applyTerms));
  });

  it("uses the shared wording in llms.txt", () => {
    const llms = buildLlmsTxt();
    assert.ok(llms.includes(PILOT_OFFER.includes));
    assert.ok(llms.includes(PILOT_OFFER.applyTerms));
    assert.ok(llms.includes(PILOT_OFFER.invitation));
  });

  it("uses the shared wording in the pilot page metadata, within the length limit", () => {
    const description = PAGE_SEO["/pilot-program"].description;
    assert.ok(description.includes(PILOT_OFFER.includes));
    assert.ok(description.length <= 160, `${description.length} characters`);
  });

  it("uses the shared wording in every pilot FAQ answer", () => {
    assert.ok(pilotFaqAnswers.length >= 2);
    for (const answer of pilotFaqAnswers) {
      assert.ok(answer.includes(PILOT_OFFER.includes), answer);
      assert.ok(answer.includes(PILOT_OFFER.invitation), answer);
    }
  });

  it("uses the shared terms in the application step", () => {
    assert.ok(PILOT_PROGRAM.steps[0].description.endsWith(PILOT_OFFER.applyTerms));
    assert.ok(PILOT_PROGRAM.discount.endsWith(PILOT_OFFER.applyTerms));
  });

  it("has no hand-written copy of the promises left in pages and components", () => {
    const files = [
      "src/app/(marketing)/pilot-program/page.tsx",
      "src/app/(marketing)/page.tsx",
      "src/components/marketing/guide-page-view.tsx",
      "src/lib/company/company-schema.ts",
      "src/lib/seo/routes.ts",
      "src/lib/seo/llms-txt.ts",
      "src/lib/marketing/faq-content.ts",
      "src/lib/marketing/content.ts",
    ];
    for (const file of files) {
      const source = readSource(file);
      assert.match(source, /@\/lib\/marketing\/pilot-offer/, `${file} imports the shared wording`);
      assert.doesNotMatch(source, /weekly written check-ins and pilot terms/, `${file} repeats the wording`);
      assert.doesNotMatch(source, /"[^"]*free and non-binding[^"]*"/, `${file} repeats the apply terms`);
    }
  });
});
