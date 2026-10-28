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

  it("has a public, indexable route with its own title", () => {
    assert.equal(page.path, "/alternatives/agencyanalytics");
    assert.equal(PAGE_SEO[page.path]?.title, "AgencyAnalytics Alternative: Fair Comparison");
    assert.ok(PAGE_SEO[page.path].title.length + " | Auroranexis".length <= 60);
    assert.match(readSource("src/lib/deployment/domain-routing.ts"), /pathname\.startsWith\("\/alternatives\/"\)/);
    assert.match(readSource("src/app/(marketing)/alternatives/agencyanalytics/page.tsx"), /createPageMetadataForPath\(page\.path\)/);
  });
});
