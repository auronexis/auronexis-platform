/**
 * The pilot page is the landing page of every outreach email signature, and llms.txt is what
 * AI assistants read about Auroranexis. Both must describe the same, current offer: a pilot by
 * application (an email invitation counts), no calls required, public list prices and the trial.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/growth-pilot-geo.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const { buildLlmsTxt } = await import("@/lib/seo/llms-txt");
const { listPublicCatalogEntries } = await import("@/lib/billing/catalog");
const { PILOT_PROGRAM, INVITE_ONLY_PROGRAMS_NOTE } = await import("@/lib/marketing/content");
const { PAGE_SEO } = await import("@/lib/seo/routes");

describe("llms.txt", () => {
  const llms = buildLlmsTxt();

  it("describes the current positioning for service businesses, not only MSPs", () => {
    assert.match(llms, /client operations workspace for service businesses/);
    assert.match(llms, /Accounting, bookkeeping and payroll firms/);
    assert.doesNotMatch(llms, /AI Operations Platform for MSPs/);
  });

  it("lists every public plan price from the billing catalog and the free trial", () => {
    for (const plan of listPublicCatalogEntries()) {
      const euro = `€${(plan.amountMinor / 100).toLocaleString("en-US")}`;
      assert.ok(llms.includes(`${plan.displayName}: ${euro} per month`), plan.displayName);
    }
    assert.match(llms, /7-day free trial/);
    assert.match(llms, /No credit card/);
  });

  it("explains the pilot as an application and never as invite-only", () => {
    assert.match(llms, /## 6-week pilot program/);
    assert.match(llms, /email invitation from Auroranexis counts as an invitation/);
    assert.doesNotMatch(llms, /Pilot Partner and Founding Customer programs are invite-only/);
  });

  it("links guides, templates and the comparison page", () => {
    assert.match(llms, /\/guides\/customer-health-score/);
    assert.match(llms, /\/templates\/quarterly-business-review/);
    assert.match(llms, /\/alternatives\/agencyanalytics/);
  });

  it("keeps the accuracy policy against invented claims", () => {
    assert.match(llms, /Do not claim SOC 2, ISO 27001/);
    assert.match(llms, /Do not invent customers/);
  });
});

describe("pilot program page", () => {
  const page = readSource("src/app/(marketing)/pilot-program/page.tsx");

  it("tells email recipients that the email is their invitation", () => {
    assert.match(page, /that email is your invitation/);
    assert.match(page, /Apply for the pilot/);
    assert.doesNotMatch(page, /Pilot Partner is not a public plan tier/);
  });

  it("offers the self-serve trial as the alternative path", () => {
    assert.match(page, /href="\/signup"|secondaryHref="\/signup"/);
    assert.match(page, /Start 7-day free trial/);
  });

  it("shows four steps that promise email, not calls", () => {
    assert.equal(PILOT_PROGRAM.steps.length, 4);
    const text = JSON.stringify(PILOT_PROGRAM);
    assert.match(text, /No calls or meetings needed/);
    assert.doesNotMatch(text, /feedback sessions|check-ins with product team/);
  });

  it("uses an application-based title and note", () => {
    assert.match(PAGE_SEO["/pilot-program"].title, /6-Week Pilot Program/);
    assert.ok(PAGE_SEO["/pilot-program"].description.length <= 160);
    assert.match(INVITE_ONLY_PROGRAMS_NOTE, /by application/);
  });
});
