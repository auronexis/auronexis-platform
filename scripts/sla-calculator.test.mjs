/**
 * The free SLA & uptime calculator (/tools/sla-calculator): the maths, the numbers quoted in the
 * page copy, and the route registration that makes the page public and indexable.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/sla-calculator.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const calc = await import("@/lib/tools/sla-calculator");
const { SLA_CALCULATOR_PAGE: page } = await import("@/lib/seo/tools-content");
const { PAGE_SEO } = await import("@/lib/seo/routes");
const { MARKETING_ROUTES, PUBLIC_SITEMAP_ROUTES } = await import("@/lib/company/company-links");
const { isMarketingPublicPath } = await import("@/lib/deployment/domain-routing");
const { isIndexablePublicRoute } = await import("@/lib/seo/route-catalog");

const month = calc.periodSeconds("month");
const row = (sla) => calc.downtimeRow(sla).downtime;

describe("SLA maths", () => {
  it("converts common targets into the downtime other calculators publish", () => {
    assert.equal(row(99.9).year, "8h 45m 57s");
    assert.equal(row(99.9).month, "43m 49s");
    assert.equal(row(99.9).day, "1m 26s");
    assert.equal(row(99.99).month, "4m 22s");
    assert.equal(row(99.99).year, "52m 35s");
    assert.equal(row(99.999).year, "5m 15s");
    assert.equal(row(99).day, "14m 24s");
  });

  it("absorbs float noise instead of losing a second", () => {
    assert.equal(row(90).day, "2h 24m");
    assert.equal(row(95).day, "1h 12m");
  });

  it("rounds allowed downtime down, never up", () => {
    // 99.9% of a year is 31,557.6 s of downtime: show 57 s, not 58 s.
    assert.equal(calc.formatDuration(31557.6), "8h 45m 57s");
    assert.equal(calc.formatDuration(0.86), "0.8s");
  });

  it("formats durations compactly", () => {
    assert.equal(calc.formatDuration(0), "0s");
    assert.equal(calc.formatDuration(60), "1m");
    assert.equal(calc.formatDuration(86400), "1d");
    assert.equal(calc.formatDuration(3 * 86400 + 5 * 60), "3d 5m");
    assert.equal(calc.formatDuration(-1), "–");
  });

  it("works back from an outage to the achieved uptime", () => {
    assert.equal(calc.formatPercent(calc.uptimeFromDowntime(90 * 60, month), 2), "99.79%");
    assert.equal(calc.uptimeFromDowntime(0, month), 100);
    assert.equal(calc.uptimeFromDowntime(month * 2, month), 0);
    assert.throws(() => calc.uptimeFromDowntime(-1, month));
  });

  it("combines services in series and in parallel", () => {
    assert.equal(calc.formatPercent(calc.serialAvailability([99.9, 99.9, 99.95]), 2), "99.75%");
    assert.equal(calc.formatPercent(calc.parallelAvailability([99, 99]), 2), "99.99%");
    assert.throws(() => calc.serialAvailability([]));
    assert.throws(() => calc.parallelAvailability([101]));
  });

  it("rejects targets outside 0–100", () => {
    assert.throws(() => calc.allowedDowntimeSeconds(100.1, month));
    assert.throws(() => calc.allowedDowntimeSeconds(-1, month));
    assert.equal(calc.allowedDowntimeSeconds(100, month), 0);
  });
});

describe("SLA calculator page copy", () => {
  const faqText = page.faq.map((item) => item.answer).join("\n");

  it("quotes the same figures the calculator produces", () => {
    for (const value of [row(99.9).day, row(99.9).week, row(99.9).month, row(99.9).year]) {
      assert.ok(faqText.includes(value), `FAQ should mention ${value} for 99.9%`);
    }
    for (const value of [row(99.99).month, row(99.99).year, row(99.5).day, row(99.5).year]) {
      assert.ok(faqText.includes(value), `FAQ should mention ${value}`);
    }
    assert.ok(page.formula[0].example.includes(row(99.9).month));
  });

  it("has a short title and a meta description within limits", () => {
    assert.ok(`${page.seoTitle} | Auroranexis`.length <= 60, page.seoTitle);
    assert.ok(page.metaDescription.length <= 160, `${page.metaDescription.length} characters`);
    assert.ok(page.faq.length >= 5);
  });
});

describe("SLA calculator route", () => {
  const path = MARKETING_ROUTES.slaCalculator;

  it("is public, indexable and in the sitemap", () => {
    assert.equal(path, "/tools/sla-calculator");
    assert.ok(PUBLIC_SITEMAP_ROUTES.includes(path));
    assert.ok(isMarketingPublicPath(path));
    assert.ok(isIndexablePublicRoute(path));
    assert.equal(PAGE_SEO[path].title, page.seoTitle);
  });

  it("is linked from the footer, llms.txt and related SLA pages", () => {
    assert.match(readSource("src/lib/company/company-links.ts"), /href: MARKETING_ROUTES\.slaCalculator/);
    assert.match(readSource("src/lib/seo/llms-txt.ts"), /MARKETING_ROUTES\.slaCalculator/);
    assert.match(readSource("src/lib/seo/guides-content.ts"), /MARKETING_ROUTES\.slaCalculator/);
    assert.match(readSource("src/lib/seo/landing-content.ts"), /MARKETING_ROUTES\.slaCalculator/);
  });

  it("renders the reference table on the server and the widget on the client", () => {
    const pageSource = readSource("src/app/(marketing)/tools/sla-calculator/page.tsx");
    assert.match(pageSource, /SLA_REFERENCE_TABLE\.map/);
    assert.doesNotMatch(pageSource, /^"use client"/);
    assert.match(readSource("src/components/marketing/sla-calculator.tsx"), /^"use client"/);
  });
});
