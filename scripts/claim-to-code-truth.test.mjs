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

  const homepage = readSource("src/app/(marketing)/page.tsx");
  assert.doesNotMatch(homepage, /EU-friendly/);
  assert.match(homepage, /EU-capable infrastructure/);

  const enterprise = readSource("src/app/(marketing)/enterprise/page.tsx");
  assert.doesNotMatch(enterprise, /EU-friendly/);
  assert.match(enterprise, /EU-capable infrastructure/);
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
  assert.doesNotMatch(block, /Protect recurring revenue/i);
  assert.doesNotMatch(block, /without adding reporting-focused roles/i);
  assert.doesNotMatch(block, /without proportional growth in reporting overhead/i);
  assert.match(block, /support retention efforts through proactive operational transparency/);
  assert.match(block, /support delivery oversight across a growing client portfolio/);
  assert.match(block, /track and report SLA performance with auditable records/);
  assert.match(block, /helps teams document operational performance with auditable records/);

  const marketing = readSource("src/lib/marketing/content.ts");
  assert.doesNotMatch(marketing, /prove SLA performance/);
  assert.match(marketing, /track and report SLA performance/);
});

test("marketing-agencies does not promise margin protection, headcount freeze, or absolute delivery-value proof", () => {
  const audience = readSource("src/lib/seo/audience-content.ts");
  const start = audience.indexOf('"marketing-agencies": buildLandingPage');
  const end = audience.indexOf('"it-service-providers": buildLandingPage', start + 1);
  const block = audience.slice(start, end);
  assert.doesNotMatch(block, /without adding headcount/i);
  assert.doesNotMatch(block, /protect margin/i);
  assert.doesNotMatch(block, /reinforces trust and retention/i);
  assert.doesNotMatch(block, /demonstrate measurable delivery value/i);
  assert.match(
    block,
    /support delivery-value discussions with operational evidence during renewals/,
  );
  assert.match(
    block,
    /Agencies can improve operational consistency by standardizing how teams monitor, communicate, and report across the portfolio/,
  );
  assert.match(
    block,
    /supports transparent client communication and retention discussions/,
  );
  assert.match(
    block,
    /executive-ready reporting that supports delivery oversight across a growing client portfolio/,
  );
});

test("it-service-providers and industries/it do not promise revenue protection or dispute prevention", () => {
  const audience = readSource("src/lib/seo/audience-content.ts");
  const aStart = audience.indexOf('"it-service-providers": buildLandingPage');
  const aEnd = audience.indexOf("msps: buildLandingPage", aStart + 1);
  const aBlock = audience.slice(aStart, aEnd);
  assert.doesNotMatch(aBlock, /protect revenue/i);
  assert.doesNotMatch(aBlock, /before clients question/i);
  assert.doesNotMatch(aBlock, /Reduced SLA disputes/);
  assert.match(
    aBlock,
    /Service providers can document reliability with operational records that support client reviews/,
  );

  const industry = readSource("src/lib/seo/industry-content.ts");
  const iStart = industry.indexOf("it: buildLandingPage");
  const iEnd = industry.indexOf("cybersecurity: buildLandingPage", iStart + 1);
  const iBlock = industry.slice(iStart, iEnd);
  assert.doesNotMatch(iBlock, /Protect recurring revenue/);
  assert.doesNotMatch(iBlock, /before they become contract disputes/);
  assert.match(
    iBlock,
    /Support recurring client relationships by surfacing accounts that may require attention/,
  );
  assert.match(
    iBlock,
    /surface SLA breaches for review and documented follow-up/,
  );
});

test("homepage and about avoid ROI show claims and unsupported prove-value language", () => {
  const page = readSource("src/app/(marketing)/page.tsx");
  assert.doesNotMatch(page, /prove outcomes/);
  assert.match(page, /document operational outcomes/);

  const about = readSource("src/app/(marketing)/about/page.tsx");
  assert.doesNotMatch(about, /prove value/);
  assert.match(about, /document delivered value/);

  const marketing = readSource("src/lib/marketing/content.ts");
  assert.doesNotMatch(marketing, /OAuth and connector health jobs/);
  assert.doesNotMatch(marketing, /protect revenue and delivery quality/);
  assert.match(
    marketing,
    /Connect supported CRM, ticketing, messaging, and productivity systems through available connectors and integration workflows/,
  );
});

test("public audience pages avoid Frankfurt customer-option and headcount outcome overclaims", () => {
  const audience = readSource("src/lib/seo/audience-content.ts");
  assert.doesNotMatch(audience, /Frankfurt region support/i);
  assert.doesNotMatch(audience, /without adding headcount/i);
  assert.doesNotMatch(audience, /additional operations headcount/i);
  assert.doesNotMatch(audience, /protect margin/i);
  assert.doesNotMatch(audience, /protect revenue by/i);
  assert.match(
    audience,
    /EU-capable infrastructure with data-residency requirements confirmed for applicable enterprise arrangements/,
  );

  const industry = readSource("src/lib/seo/industry-content.ts");
  assert.doesNotMatch(industry, /without adding management overhead per client/i);
  assert.doesNotMatch(industry, /Protect recurring revenue/);
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

test("public role docs match assignable UserRole registry (owner/admin/staff/viewer)", () => {
  const rbac = readSource("src/lib/rbac/permissions.ts");
  assert.match(
    rbac,
    /USER_ROLES\s*=\s*\[["']owner["'],\s*["']admin["'],\s*["']staff["'],\s*["']viewer["']\]/,
  );

  const ops = readSource("src/lib/docs/pages/operations.ts");
  const account = readSource("src/lib/docs/pages/account.ts");
  const publicDocs = `${ops}\n${account}`;

  assert.match(ops, /caption:\s*"Internal role summary"/);
  assert.match(ops, /"Owner"/);
  assert.match(ops, /"Admin"/);
  assert.match(ops, /"Staff"/);
  assert.match(ops, /"Viewer"/);

  assert.doesNotMatch(publicDocs, /invite owners,/i);
  assert.doesNotMatch(
    publicDocs,
    /Invite new members with the appropriate role \(Owner, Admin, Staff, or Viewer\)/,
  );
  assert.match(ops, /invite admins, staff, or viewers/i);
  assert.match(account, /Invite new members as Admin, Staff, or Viewer/);

  assert.doesNotMatch(publicDocs, /Staff with clients\.write permission/);
  assert.match(ops, /Staff and viewer roles have read-only client access/);

  assert.doesNotMatch(publicDocs, /"Manager"/);
  assert.doesNotMatch(publicDocs, /"Analyst"/);
  assert.doesNotMatch(publicDocs, /"Member"/);
  assert.doesNotMatch(publicDocs, /"Readonly"/);
  assert.doesNotMatch(publicDocs, /integration-manager/i);
});

test("SLA docs describe monitoring targets not contractual fulfillment", () => {
  const ops = readSource("src/lib/docs/pages/operations.ts");
  assert.doesNotMatch(ops, /so your team meets contractual obligations/);
  assert.doesNotMatch(ops, /convert contractual commitments into visible operational signals/);
  assert.doesNotMatch(ops, /both a contractual and portfolio health requirement/);
  assert.match(ops, /monitoring targets/);
  assert.match(ops, /does not fulfill or guarantee legal contractual obligations/);
});

test("report schedules create draft shells not full generation", () => {
  const ops = readSource("src/lib/docs/pages/operations.ts");
  assert.doesNotMatch(ops, /Schedules automates recurring generation/);
  assert.doesNotMatch(ops, /Schedules for automated generation under Reports/);
  assert.match(ops, /creates recurring draft report shells/);
  assert.match(ops, /scheduled runs create draft shells only/);
});

test("monitoring docs do not claim live HTTP probes or inbound webhooks", () => {
  const ops = readSource("src/lib/docs/pages/operations.ts");
  assert.doesNotMatch(ops, /HTTP and Healthcheck run scheduled reachability/);
  assert.doesNotMatch(ops, /Webhook receives payloads from external tools/);
  assert.match(ops, /do not perform live HTTP reachability probes/);
  assert.match(ops, /accept inbound webhook payloads from external tools/);
});

test("getting-started docs gate SLA and Usage by plan and role", () => {
  const ops = readSource("src/lib/docs/pages/operations.ts");
  assert.doesNotMatch(ops, /all roles can review effective limits in Settings → Usage/);
  assert.match(ops, /Staff and viewer roles do not have Settings access/);
  assert.match(ops, /On Business or Enterprise, open Settings → SLA/);
});
