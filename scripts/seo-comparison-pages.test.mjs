/**
 * Comparison pages stay fair and verifiable: dated, sourced, no unsupported superiority
 * claims, an honest "when the competitor fits better" section, and a public route.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/seo-comparison-pages.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const { AGENCYANALYTICS_ALTERNATIVE: page } = await import("@/lib/seo/comparison-content");
const { PAGE_SEO } = await import("@/lib/seo/routes");
const { AGENCYANALYTICS_FACTS_CHECKED_ON } = await import("@/lib/seo/comparison-content");
const { contentLastModified } = await import("@/lib/seo/content-dates");
const { isMarketingPublicPath } = await import("@/lib/deployment/domain-routing");

describe("AgencyAnalytics alternative page", () => {
  it("is dated and cites the competitor's own pricing page", () => {
    assert.match(page.checkedOn, /^\d{1,2} [A-Z][a-z]+ 20\d\d$/);
    assert.ok(page.sources.some((source) => source.href === "https://agencyanalytics.com/pricing"));
    assert.match(page.trademarkNote, /not affiliated/);
  });

  it("makes no unsupported superiority claims", () => {
    const text = JSON.stringify({ ...page, faq: page.faq.map((item) => item.answer) });
    for (const phrase of [/\bbest\b(?! AgencyAnalytics alternative)/i, /\bcheaper than\b(?! AgencyAnalytics\?)/i, /#1/, /\bsuperior\b/i, /\blacks?\b/i, /\bmissing\b/i]) {
      const allowedQuestion = /What is the best AgencyAnalytics alternative\?|Is Auroranexis cheaper than AgencyAnalytics\?/;
      assert.ok(!phrase.test(text.replace(allowedQuestion, "")), `claim found: ${phrase}`);
    }
    for (const row of page.rows) {
      assert.ok(row.competitor.trim() && row.auroranexis.trim(), row.criterion);
    }
  });

  it("says honestly when the competitor fits better", () => {
    assert.ok(page.chooseCompetitor.length >= 3);
    assert.ok(page.rows.some((row) => /No marketing data connectors/.test(row.auroranexis)));
    assert.ok(page.rows.some((row) => /Unlimited staff users/.test(row.competitor)));
  });

  it("price example arithmetic matches the published per-client price", () => {
    assert.match(page.costExample.rows[0].competitor, /USD 200/);
    assert.match(page.costExample.rows[1].competitor, /USD 500/);
    assert.match(page.costExample.note, /without conversion/);
  });

  it("answers pricing and alternatives searches with dated, sourced facts", () => {
    assert.match(page.pricingSnapshot.heading, /AgencyAnalytics pricing/);
    assert.ok(page.pricingSnapshot.items.some((item) => /USD 20 per client per month/.test(item)));
    assert.equal(page.pricingSnapshot.sourceHref, "https://agencyanalytics.com/pricing");
    const names = page.otherAlternatives.items.map((item) => item.name);
    assert.deepEqual(names, ["Swydo", "DashThis", "Databox", "Whatagraph", "Auroranexis"]);
    for (const item of page.otherAlternatives.items) {
      assert.ok(item.pricing.length > 10 && item.bestFor.length > 10, item.name);
      if (item.name !== "Auroranexis") {
        assert.ok(page.sources.some((source) => source.href === item.href), `${item.name} is cited`);
      }
    }
    assert.ok(page.faq.some((entry) => /How much does AgencyAnalytics cost/.test(entry.question)));
    assert.ok(page.metaDescription.length <= 160);
    assert.match(page.trademarkNote, /Swydo, DashThis, Databox and Whatagraph are trademarks/);
  });

  it("has a public, indexable route with its own title", () => {
    assert.equal(page.path, "/alternatives/agencyanalytics");
    assert.equal(PAGE_SEO[page.path]?.title, "AgencyAnalytics Alternatives & Pricing (2026)");
    assert.ok(PAGE_SEO[page.path].title.length + " | Auroranexis".length <= 60);
    assert.equal(isMarketingPublicPath(page.path), true);
    assert.match(readSource("src/app/(marketing)/alternatives/agencyanalytics/page.tsx"), /createPageMetadataForPath\(page\.path\)/);
  });

  it("uses one check date everywhere, matching the sitemap lastmod", () => {
    const checked = AGENCYANALYTICS_FACTS_CHECKED_ON;
    assert.equal(page.checkedOn, checked);
    assert.equal(page.pricingSnapshot.checkedOn, checked);
    assert.equal(page.otherAlternatives.checkedOn, checked);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const [day, month, year] = checked.split(" ");
    const iso = `${year}-${String(months.indexOf(month) + 1).padStart(2, "0")}-${day.padStart(2, "0")}`;
    assert.equal(contentLastModified(page.path), iso, "content-dates.ts entry must match the check date");
    const everyDate = JSON.stringify(page).match(/\b\d{1,2} (?:January|February|March|April|May|June|July|August|September|October|November|December) 20\d\d\b/g) ?? [];
    assert.deepEqual([...new Set(everyDate)], [checked], "no stale check dates left in the copy");
  });
});
