import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import test from "node:test";
import { pathExists, readSource, rootDir } from "./_test-helpers/read-source.mjs";

function walkTsFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkTsFiles(full, out);
      continue;
    }
    if (extname(entry) === ".ts" || extname(entry) === ".tsx") {
      out.push(full);
    }
  }
  return out;
}

test("chapter 16 removed verified dead UI and helpers", () => {
  assert.equal(pathExists("src/components/ui/checkbox.tsx"), false);
  assert.equal(pathExists("src/components/observability"), false);
  assert.equal(pathExists("scripts/export-transparent-logos.mjs"), false);

  const typography = readSource("src/components/ui/typography.tsx");
  assert.doesNotMatch(typography, /export function BodyText/);
  assert.doesNotMatch(typography, /export function LabelText/);
  assert.doesNotMatch(typography, /export function EyebrowText/);

  const formSection = readSource("src/components/ui/form-section.tsx");
  assert.doesNotMatch(formSection, /export function DangerZone/);

  const uiIndex = readSource("src/components/ui/index.ts");
  assert.doesNotMatch(uiIndex, /DangerZone|BodyText|LabelText|EyebrowText/);

  const reportsTypes = readSource("src/lib/reports/types.ts");
  assert.doesNotMatch(reportsTypes, /wasReportDelivered/);

  const companySeo = readSource("src/lib/company/company-seo.ts");
  assert.doesNotMatch(companySeo, /canonicalBaseUrl/);

  const risksTypes = readSource("src/lib/risks/types.ts");
  assert.doesNotMatch(risksTypes, /export type RiskMetrics/);
  const risksIndex = readSource("src/lib/risks/index.ts");
  assert.doesNotMatch(risksIndex, /\bRiskMetrics\b/);
});

test("src still has no TODO FIXME HACK markers", () => {
  const files = walkTsFiles(join(rootDir, "src"));
  const hits = [];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    if (/\/\/\s*(TODO|FIXME|HACK|XXX)\b|\/\*\s*(TODO|FIXME|HACK|XXX)\b/.test(source)) {
      hits.push(file.replace(rootDir + "\\", "").replace(rootDir + "/", ""));
    }
  }
  assert.deepEqual(hits, [], `Forbidden markers:\n${hits.join("\n")}`);
});

test("billing docs no longer describe active Stripe checkout", () => {
  const billing = readSource("docs/billing.md");
  assert.match(billing, /Paddle-only|Paddle/);
  assert.doesNotMatch(billing, /Stripe Checkout \/ Customer Portal \/ Webhooks \(existing integration\)/);
  const website = readSource("docs/website.md");
  assert.match(website, /Paddle Checkout/);
  assert.doesNotMatch(website, /Link to Stripe Checkout/);
  const domain = readSource("docs/domain-setup.md");
  assert.match(domain, /\/api\/paddle\/webhook/);
  assert.doesNotMatch(domain, /\/api\/stripe\/webhook/);
});

test("ai provider registry has no stale future openai comment", () => {
  const providers = readSource("src/lib/ai/providers/index.ts");
  assert.doesNotMatch(providers, /Future:\s*openai/);
});

test("domain routing verifier remains available", () => {
  assert.ok(pathExists("scripts/verify-domain-routing.mjs"));
  const pkg = readSource("package.json");
  assert.match(pkg, /"verify:domain-routing"/);
});

test("no unused npm stripe packages remain", () => {
  const pkg = JSON.parse(readSource("package.json"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  assert.equal(deps.stripe, undefined);
  assert.equal(deps.sharp, undefined);
});
