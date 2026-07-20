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

test("src has no as any or ts-ignore suppressions", () => {
  const files = walkTsFiles(join(rootDir, "src"));
  const hits = [];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    if (/\bas any\b|@ts-ignore|@ts-expect-error/.test(source)) {
      hits.push(file.replace(rootDir + "\\", "").replace(rootDir + "/", ""));
    }
  }
  assert.deepEqual(hits, [], `Forbidden unsafe typing:\n${hits.join("\n")}`);
});

test("src has no console.log debug remnants", () => {
  const files = walkTsFiles(join(rootDir, "src"));
  const hits = [];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    if (/console\.log\s*\(/.test(source)) {
      hits.push(file.replace(rootDir + "\\", "").replace(rootDir + "/", ""));
    }
  }
  assert.deepEqual(hits, [], `Forbidden console.log:\n${hits.join("\n")}`);
});

test("package.json has no stripe dependency", () => {
  const pkg = JSON.parse(readSource("package.json"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  assert.equal(deps.stripe, undefined);
  assert.equal(deps["@stripe/stripe-js"], undefined);
  assert.equal(deps["@stripe/react-stripe-js"], undefined);
});

test("dead deprecated exports remain removed", () => {
  assert.equal(pathExists("src/lib/risks/summary.ts"), false);
  const portal = readSource("src/components/client-portal/portal-ui.tsx");
  assert.doesNotMatch(portal, /PortalLogoMark/);
  const sections = readSource("src/components/marketing/marketing-sections.tsx");
  assert.doesNotMatch(sections, /export function MarketingCta/);
  assert.doesNotMatch(sections, /["']use client["']/);
  const auth = readSource("src/lib/marketing/auth-context.ts");
  assert.doesNotMatch(auth, /getMarketingHeaderNavLinks/);
  const routing = readSource("src/lib/deployment/middleware-routing.ts");
  assert.doesNotMatch(routing, /shouldAttachAppNoIndexHeader/);
  const risksIndex = readSource("src/lib/risks/index.ts");
  assert.doesNotMatch(risksIndex, /buildRiskSummary|getRiskMetrics/);
  const env = readSource("src/lib/env.ts");
  assert.doesNotMatch(env, /getStripeSecretKey/);
});

test("design system empty and badge composition is centralized", () => {
  assert.ok(pathExists("src/components/ui/compact-empty-state.tsx"));
  const compact = readSource("src/components/ui/compact-empty-state.tsx");
  assert.match(compact, /export function CompactEmptyState/);
  const riskAi = readSource("src/components/ai-risks/risk-ai-empty-state.tsx");
  assert.match(riskAi, /CompactEmptyState/);
  const executive = readSource("src/components/executive-reports/executive-empty-state.tsx");
  assert.match(executive, /CompactEmptyState/);
  const analysis = readSource("src/components/incidents/ai/ai-analysis-empty-state.tsx");
  assert.match(analysis, /CompactEmptyState/);
  const aiEmpty = readSource("src/components/ai/ai-empty-state.tsx");
  assert.match(aiEmpty, /CompactEmptyState/);
  assert.doesNotMatch(aiEmpty, /^["']use client["']/m);
  const marketingBadge = readSource("src/components/marketing/status-badge.tsx");
  assert.match(marketingBadge, /@\/components\/ui\/badge/);
  const pipeline = readSource("src/components/sales/pipeline-stage-badge.tsx");
  assert.match(pipeline, /@\/components\/ui\/badge/);
});

test("typed supabase helpers remain the preferred write path", () => {
  const typed = readSource("src/lib/supabase/typed.ts");
  assert.match(typed, /export function insertRows/);
  assert.match(typed, /export function updateRows/);
  assert.match(typed, /export function upsertRows/);
});

test("no stripe API route directory", () => {
  assert.equal(pathExists("src/app/api/stripe"), false);
  assert.equal(pathExists("src/app/api/stripe/webhook/route.ts"), false);
});
