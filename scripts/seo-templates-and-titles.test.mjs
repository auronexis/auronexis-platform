/**
 * Keyword-led SEO: templates carry real, copyable content (example table, steps, CSV
 * download), title tags match researched search terms, and the new QBR template is wired in.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/seo-templates-and-titles.test.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const { TEMPLATE_PAGES } = await import("@/lib/seo/landing-content");
const { PAGE_SEO } = await import("@/lib/seo/routes");

const SUFFIX = " | Auroranexis".length;

describe("template pages", () => {
  it("every template has an example, FAQ and related links", () => {
    for (const page of Object.values(TEMPLATE_PAGES)) {
      assert.ok(page.example, `${page.slug} has no example`);
      assert.ok(page.example.rows.length >= 3, `${page.slug} example is too thin`);
      for (const row of page.example.rows) {
        assert.equal(row.length, page.example.columns.length, `${page.slug}: row width differs from columns`);
      }
      assert.ok(page.faq.length >= 3, `${page.slug} needs at least 3 FAQs`);
      assert.ok((page.relatedLinks ?? []).length >= 2, `${page.slug} needs related links`);
    }
  });

  it("CSV downloads exist in /public and match their link", () => {
    for (const page of Object.values(TEMPLATE_PAGES)) {
      if (!page.download) continue;
      const file = `public${page.download.href}`;
      assert.ok(existsSync(file), `${file} missing`);
      assert.ok(readFileSync(file, "utf8").split("\n")[0].includes(","), `${file} has no header row`);
    }
    for (const slug of ["risk-register", "customer-health-score", "quarterly-business-review", "sla-policy"]) {
      assert.ok(TEMPLATE_PAGES[slug].download, `${slug} should offer a CSV`);
    }
  });

  it("risk scores in the example equal likelihood × impact", () => {
    const { columns, rows } = TEMPLATE_PAGES["risk-register"].example;
    const l = columns.indexOf("Likelihood");
    const i = columns.indexOf("Impact");
    const s = columns.indexOf("Score");
    for (const row of rows) assert.equal(Number(row[s]), Number(row[l]) * Number(row[i]), row[0]);
  });

  it("CSV downloads live outside /templates/ so the slug allowlist does not 404 them", () => {
    for (const page of Object.values(TEMPLATE_PAGES)) {
      if (page.download) assert.match(page.download.href, /^\/downloads\/templates\/[a-z-]+\.csv$/);
    }
  });

  it("signed-out visitors can download the CSVs (session middleware allows the path)", () => {
    assert.match(readSource("src/lib/supabase/middleware.ts"), /downloads\\\/templates/);
  });

  it("the QBR template is routed and linked", () => {
    assert.match(readSource("src/lib/seo/public-dynamic-slug-allowlist.ts"), /"quarterly-business-review",/);
    assert.ok(TEMPLATE_PAGES["quarterly-business-review"]);
    assert.match(readSource("src/lib/company/company-links.ts"), /quarterlyBusinessReview: "\/templates\/quarterly-business-review"/);
    assert.match(readSource("src/lib/seo/intent-ownership.ts"), /TEMPLATE_ROUTES\.quarterlyBusinessReview/);
  });
});

describe("title tags", () => {
  it("seoTitle overrides the registry title and stays short", () => {
    const routes = readSource("src/lib/seo/routes.ts");
    assert.match(routes, /title: page\.seoTitle \?\? page\.title/);
    for (const file of ["src/lib/seo/landing-content.ts", "src/lib/seo/feature-content.ts"]) {
      for (const match of readSource(file).matchAll(/seoTitle: "([^"]+)"/g)) {
        assert.ok(match[1].length + SUFFIX <= 60, `title too long: ${match[1]}`);
      }
    }
  });

  it("key pages target the researched terms", () => {
    const expectations = {
      "/templates/risk-register": /Risk Register Template/,
      "/templates/quarterly-business-review": /Quarterly Business Review/,
      "/features/profitability": /Client Profitability Analysis/,
      "/features/client-portal": /Client Portal Software/,
      "/solutions/sla-management": /SLA Management/,
    };
    for (const [path, pattern] of Object.entries(expectations)) {
      assert.match(PAGE_SEO[path]?.title ?? "", pattern, path);
    }
  });
});
