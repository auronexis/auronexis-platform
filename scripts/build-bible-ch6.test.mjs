import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { readSource, rootDir } from "./_test-helpers/read-source.mjs";

test("Build Bible V2 Chapter 6 API doc and rule exist", () => {
  assert.ok(existsSync(join(rootDir, "docs/08_BUILD_BIBLE_V2_CHAPTER_06_API.md")));
  const doc = readSource("docs/08_BUILD_BIBLE_V2_CHAPTER_06_API.md");
  assert.match(doc, /Status:\*\* Implemented/);
  const rule = readSource(".cursor/rules/build-bible-v2-ch6-api.mdc");
  assert.match(rule, /alwaysApply:\s*true/);
  assert.match(rule, /API routes orchestrate only/);
});

test("shared list helper and apiError are used by v1 routes", () => {
  const listHelper = readSource("src/lib/api/list.ts");
  assert.match(listHelper, /export function respondWithPaginatedList/);
  const incidents = readSource("src/app/api/v1/incidents/route.ts");
  const risks = readSource("src/app/api/v1/risks/route.ts");
  assert.match(incidents, /respondWithPaginatedList/);
  assert.match(risks, /respondWithPaginatedList/);
  const riskDetail = readSource("src/app/api/v1/risks/[id]/route.ts");
  assert.match(riskDetail, /apiError\(404/);
  assert.doesNotMatch(riskDetail, /apiJson\(\{\s*error:/);
});

test("webhook signing is centralized under webhooks/signing", () => {
  const canonical = readSource("src/lib/webhooks/signing.ts");
  const apiShim = readSource("src/lib/api/webhooks/signing.ts");
  assert.match(canonical, /export function verifyWebhookSignature/);
  assert.match(apiShim, /from \"@\/lib\/webhooks\/signing\"/);
});

test("form validation and user org helpers are shared", () => {
  const form = readSource("src/lib/validation/form-fields.ts");
  const clients = readSource("src/lib/clients/queries.ts");
  assert.match(form, /export const optionalText/);
  assert.match(clients, /export async function userBelongsToOrganization/);
  const risksActions = readSource("src/lib/risks/actions.ts");
  assert.match(risksActions, /optionalText/);
  assert.match(risksActions, /userBelongsToOrganization/);
  assert.doesNotMatch(
    risksActions,
    /const optionalText = z\s*\n\s*\.string\(\)/,
  );
});

test("cron job actions require session authorization", () => {
  const jobs = readSource("src/lib/jobs/actions.ts");
  assert.match(jobs, /requireSession/);
  assert.match(jobs, /canManageOrganizationSettings/);
});

test("paddle webhook fails closed on idempotency store errors", () => {
  const idem = readSource("src/lib/paddle/idempotency.ts");
  const route = readSource("src/app/api/paddle/webhook/route.ts");
  assert.match(idem, /unavailable/);
  assert.match(route, /status === \"unavailable\"/);
  assert.match(route, /Webhook processing failed/);
  assert.doesNotMatch(route, /error: message/);
});

test("domain AI providers share resolveDomainAIProvider", () => {
  const shared = readSource("src/lib/ai/server/resolve-domain-provider.ts");
  const risks = readSource("src/lib/ai-risks/providers.ts");
  const incidents = readSource("src/lib/ai-incidents/providers.ts");
  assert.match(shared, /export function resolveDomainAIProvider/);
  assert.match(risks, /resolveDomainAIProvider/);
  assert.match(incidents, /resolveDomainAIProvider/);
});

test("all api route.ts files remain under app/api", () => {
  const apiRoot = join(rootDir, "src/app/api");
  const routes = [];

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (entry.name === "route.ts") {
        routes.push(full);
      }
    }
  }

  walk(apiRoot);
  assert.ok(routes.length >= 20);
});
