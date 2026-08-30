/**
 * Claim-to-code truth remediation — canonical public copy contracts.
 * Asserts product-truth wording on shared content sources (not full-page snapshots).
 */

import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

function extractAutomationAgenciesBlock(audience) {
  const start = audience.indexOf('"automation-agencies": buildLandingPage');
  assert.ok(start >= 0, "automation-agencies landing block missing");
  const next = audience.indexOf('"enterprise-teams": buildLandingPage', start + 1);
  assert.ok(next > start, "enterprise-teams block after automation-agencies missing");
  return audience.slice(start, next);
}

test("automation-agencies does not promise churn reduction, headcount freeze, or pre-impact detection", () => {
  const block = extractAutomationAgenciesBlock(readSource("src/lib/seo/audience-content.ts"));
  assert.doesNotMatch(block, /reduce client churn from undetected workflow failures/);
  assert.doesNotMatch(block, /without adding operations headcount/);
  assert.doesNotMatch(block, /before client impact/);
  assert.doesNotMatch(block, /before clients discover them/);
  assert.match(
    block,
    /help teams address workflow issues that can contribute to client dissatisfaction or churn/,
  );
  assert.match(block, /support delivery oversight across a growing client portfolio/);
  assert.match(block, /earlier in the incident lifecycle/);
  assert.match(block, /help teams identify configured monitoring signals earlier/);
});

test("automation-agencies does not claim to demonstrate or prove ROI without an ROI engine", () => {
  const block = extractAutomationAgenciesBlock(readSource("src/lib/seo/audience-content.ts"));
  assert.doesNotMatch(block, /demonstrate automation ROI/i);
  assert.doesNotMatch(block, /demonstrating automation performance and ROI/i);
  assert.doesNotMatch(block, /prove ROI|calculate ROI|guarantee ROI/i);
  assert.match(block, /support ROI discussions with operational performance evidence/);
  assert.match(
    block,
    /Executive reports summarizing automation performance and operational value evidence/,
  );

  const marketing = readSource("src/lib/marketing/content.ts");
  assert.doesNotMatch(marketing, /Show automation ROI/);
  assert.match(
    marketing,
    /Support ROI discussions with operational performance evidence, workflow reliability/,
  );
});

test("monitoring docs keep optional auto-incident creation and scope the Manual example", () => {
  const ops = readSource("src/lib/docs/pages/operations.ts");
  assert.match(ops, /Optional automatic incident creation on critical failures/);
  assert.match(
    ops,
    /In this example, automatic incident creation is disabled; events remain available as audit-trail context/,
  );
  assert.doesNotMatch(
    ops,
    /Events provide audit trail context in monthly reports without automatic incident creation/,
  );
});

test("integrations docs describe auth and sync as capability-dependent scaffolding", () => {
  const platform = readSource("src/lib/docs/pages/platform.ts");
  const start = platform.indexOf("export const INTEGRATIONS_DOC");
  const end = platform.indexOf("export const ", start + 1);
  const doc = platform.slice(start, end > start ? end : undefined);

  assert.match(
    doc,
    /Authentication method depends on the integration and may include OAuth,\s*API credentials, webhook configuration, or manual setup/,
  );
  assert.match(
    doc,
    /Available sync behavior depends on the selected integration\. The integration catalog reflects currently supported capabilities/,
  );
  assert.match(
    doc,
    /Integration infrastructure includes sync scaffolding where supported/,
  );
  assert.doesNotMatch(doc, /Connector sync for supported platforms with on-demand and scheduled runs/);
  assert.doesNotMatch(
    doc,
    /scheduled sync jobs that keep selected records aligned even when no platform trigger fires/,
  );
  assert.doesNotMatch(doc, /integration-manager account/i);
  assert.match(doc, /Sign in with an account that has permission to manage integrations/);
});

test("security highlights use EU-capable residency wording without Frankfurt customer option claim", () => {
  const marketing = readSource("src/lib/marketing/content.ts");
  assert.match(
    marketing,
    /Auroranexis uses EU-capable infrastructure\. Specific data-residency requirements are confirmed for applicable enterprise arrangements/,
  );
  assert.doesNotMatch(marketing, /Frankfurt region supported/);
  assert.doesNotMatch(
    marketing,
    /EU-friendly data residency options via Supabase \(Frankfurt region supported\)/,
  );
});

test("billing docs keep Professional+ automation truth", () => {
  const billing = readSource("src/lib/docs/pages/account.ts");
  assert.match(
    billing,
    /Professional for growing teams that need client portal delivery, integrations, automation workflows/,
  );
  assert.doesNotMatch(billing, /Business for agencies requiring automation workflows/);
  assert.doesNotMatch(billing, /Business — automation workflows/);
});

test("API docs do not claim full OpenAPI coverage", () => {
  const api = readSource("src/lib/docs/pages/account.ts");
  assert.match(api, /not a complete inventory of every API route/);
  assert.match(api, /curated OpenAPI overview/);
  assert.doesNotMatch(api, /provides full endpoint documentation/);
  assert.doesNotMatch(
    api,
    /\/api\/docs is the authoritative source for endpoint paths, request schemas,\s*and response formats/,
  );
});

test("integrations catalog preserves Teams/API available and Zapier coming soon", () => {
  const catalog = readSource("src/lib/marketing/integrations-catalog.ts");
  assert.match(catalog, /id: "teams"[\s\S]{0,220}section: "available"/);
  assert.match(catalog, /id: "api-access"[\s\S]{0,220}section: "available"/);
  assert.match(catalog, /id: "zapier"[\s\S]{0,220}section: "coming_soon"/);
});

test("msps does not promise churn reduction, SLA proof, or headcount freeze", () => {
  const audience = readSource("src/lib/seo/audience-content.ts");
  const start = audience.indexOf("msps: buildLandingPage");
  const end = audience.indexOf("consultancies: buildLandingPage", start + 1);
  const block = audience.slice(start, end);
  assert.doesNotMatch(block, /reduce churn/i);
  assert.doesNotMatch(block, /prove SLA/i);
  assert.doesNotMatch(block, /helps you prove it/i);
  assert.doesNotMatch(block, /without adding reporting-focused roles/i);
  assert.doesNotMatch(block, /without proportional growth in reporting overhead/i);
  assert.match(block, /support retention discussions through proactive transparency/);
  assert.match(block, /support delivery oversight across a growing client portfolio/);
  assert.match(block, /track and report SLA performance with auditable records/);

  const marketing = readSource("src/lib/marketing/content.ts");
  assert.doesNotMatch(marketing, /prove SLA performance/);
  assert.match(marketing, /track and report SLA performance/);
});

test("marketing-agencies does not promise headcount freeze or absolute delivery-value proof", () => {
  const audience = readSource("src/lib/seo/audience-content.ts");
  const start = audience.indexOf('"marketing-agencies": buildLandingPage');
  const end = audience.indexOf('"it-service-providers": buildLandingPage', start + 1);
  const block = audience.slice(start, end);
  assert.doesNotMatch(block, /without adding headcount/i);
  assert.doesNotMatch(block, /demonstrate measurable delivery value/i);
  assert.match(
    block,
    /support delivery-value discussions with operational evidence during renewals/,
  );
  assert.match(
    block,
    /executive-ready reporting that supports delivery oversight across a growing client portfolio/,
  );
});

test("public audience pages avoid Frankfurt customer-option and headcount outcome overclaims", () => {
  const audience = readSource("src/lib/seo/audience-content.ts");
  assert.doesNotMatch(audience, /Frankfurt region support/i);
  assert.doesNotMatch(audience, /without adding headcount/i);
  assert.doesNotMatch(audience, /additional operations headcount/i);
  assert.match(
    audience,
    /EU-capable infrastructure with data-residency requirements confirmed for applicable enterprise arrangements/,
  );

  const industry = readSource("src/lib/seo/industry-content.ts");
  assert.doesNotMatch(industry, /without adding management overhead per client/i);
  assert.match(industry, /Scale operational oversight across a growing client portfolio/);
});

test("monitoring docs avoid absolute pre-client-report detection promises", () => {
  const ops = readSource("src/lib/docs/pages/operations.ts");
  assert.doesNotMatch(ops, /escalate before clients report problems/);
  assert.match(
    ops,
    /operators can review configured monitoring signals earlier in the incident lifecycle/,
  );
});
