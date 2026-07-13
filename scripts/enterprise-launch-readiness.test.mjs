import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

test("public status page does not expose Development label", () => {
  const statusPage = readSource("src/app/(marketing)/status/page.tsx");
  const publicStatus = readSource("src/lib/marketing/public-status.ts");
  assert.doesNotMatch(statusPage, /getPlatformStatusSnapshot/);
  assert.match(publicStatus, /resolvePublicOverallStatus/);
  assert.doesNotMatch(publicStatus, /Development/);
});

test("public AI status uses explicit missing-key detail without env exposure", () => {
  const source = readSource("src/lib/marketing/public-status.ts");
  assert.match(source, /Missing API Key/);
  assert.match(source, /getOpenAIPlatformConfig/);
  assert.doesNotMatch(source, /process\.env\.OPENAI_API_KEY/);
});

test("marketing CTA uses Create workspace instead of free trial", () => {
  const cta = readSource("src/lib/marketing/cta.ts");
  const auth = readSource("src/lib/marketing/auth-context.ts");
  assert.match(cta, /Create workspace/);
  assert.doesNotMatch(cta, /Start free trial/);
  assert.match(auth, /Create workspace/);
});

test("features include business problem workflow outcome and CTA", () => {
  const content = readSource("src/lib/marketing/content.ts");
  assert.match(content, /problem:/);
  assert.match(content, /workflow:/);
  assert.match(content, /outcome:/);
  assert.match(content, /enterpriseValue:/);
  assert.match(content, /ctaLabel:/);
});

test("about and security pages link to API docs route", () => {
  const about = readSource("src/app/(marketing)/about/page.tsx");
  const security = readSource("src/app/(marketing)/security/page.tsx");
  assert.match(about, /\/api\/docs/);
  assert.match(security, /\/api\/docs/);
  assert.doesNotMatch(about, /\/docs\/api/);
  assert.doesNotMatch(security, /\/docs\/api/);
});

test("business plan no longer claims priority support in highlights", () => {
  const content = readSource("src/lib/marketing/content.ts");
  const businessBlock = content.slice(content.indexOf('name: "Business"'));
  assert.doesNotMatch(businessBlock.slice(0, 500), /Priority support/);
});

test("enterprise demo CTA routes to contact", () => {
  const cta = readSource("src/lib/marketing/cta.ts");
  assert.match(cta, /requestEnterpriseDemo[\s\S]*href: "\/contact"/);
});
