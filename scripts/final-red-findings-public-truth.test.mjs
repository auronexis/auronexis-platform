/**
 * Final red-findings public-truth regression guard.
 * Scans active public marketing/docs/SEO source only — not historical docs or migrations.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { rootDir, readSource } from "./_test-helpers/read-source.mjs";

/** Justified historical / non-public paths that may retain legacy wording. */
const ALLOWLIST_PATH_PREFIXES = [
  "docs/",
  "supabase/migrations/",
  "scripts/_fixtures/",
  ".tmp_",
  "README.md",
];

const ACTIVE_PUBLIC_ROOTS = [
  "src/app/(marketing)",
  "src/lib/marketing",
  "src/lib/seo",
  "src/lib/docs",
  "src/lib/company",
  "src/lib/branding",
  "src/lib/white-label",
  "src/components/marketing",
  "src/components/branding",
  "src/components/auth",
];

const FORBIDDEN = [
  { name: "Show automation ROI", pattern: /Show automation ROI/i },
  { name: "prove outcomes", pattern: /prove outcomes/i },
  { name: "prove value", pattern: /prove value/i },
  { name: "protect recurring revenue", pattern: /protect recurring revenue/i },
  { name: "without adding reporting-focused roles", pattern: /without adding reporting-focused roles/i },
  {
    name: "without additional operations headcount",
    pattern: /without additional operations headcount/i,
  },
  { name: "EU-friendly", pattern: /EU-friendly/i },
  { name: "integration-manager", pattern: /integration-manager/i },
  {
    name: "meets contractual obligations",
    pattern: /meets contractual obligations/i,
  },
  { name: "stale €149", pattern: /€149\b/ },
  { name: "stale €499", pattern: /€499\b/ },
  { name: "stale €1,499", pattern: /€1,?499\b/ },
  { name: "customer-facing Stripe", pattern: /\bStripe\b/ },
  { name: "customer-facing Paddle", pattern: /\bPaddle\b/ },
  { name: "customer-facing FastSpring", pattern: /\bFastSpring\b/ },
];

function isAllowlisted(relPath) {
  const normalized = relPath.replace(/\\/g, "/");
  return ALLOWLIST_PATH_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(prefix),
  );
}

function walkFiles(absDir, out = []) {
  let entries;
  try {
    entries = readdirSync(absDir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const abs = join(absDir, entry);
    const st = statSync(abs);
    if (st.isDirectory()) {
      walkFiles(abs, out);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx|mjs|md|mdx|json)$/.test(entry)) continue;
    out.push(abs);
  }
  return out;
}

function collectActivePublicSources() {
  const files = [];
  for (const root of ACTIVE_PUBLIC_ROOTS) {
    walkFiles(join(rootDir, root), files);
  }
  return files
    .map((abs) => relative(rootDir, abs).replace(/\\/g, "/"))
    .filter((rel) => !isAllowlisted(rel));
}

test("active public source has zero unsupported red-finding strings", () => {
  const files = collectActivePublicSources();
  assert.ok(files.length > 40, `expected public source corpus, got ${files.length}`);

  const violations = [];
  for (const rel of files) {
    const source = readFileSync(join(rootDir, rel), "utf8");
    for (const rule of FORBIDDEN) {
      if (rule.pattern.test(source)) {
        violations.push(`${rel}: ${rule.name}`);
      }
    }
  }

  assert.deepEqual(violations, [], `Unexpected public-truth residues:\n${violations.join("\n")}`);
});

test("canonical replacements for homepage/about/tagline and revenue language are present", () => {
  const homepage = readSource("src/app/(marketing)/page.tsx");
  assert.match(homepage, /Document value/);
  assert.match(homepage, /document operational outcomes/);
  assert.match(
    readSource("src/lib/marketing/content.ts"),
    /Connect supported CRM, ticketing, messaging, and productivity systems through available connectors and integration workflows/,
  );

  const about = readSource("src/app/(marketing)/about/page.tsx");
  assert.match(about, /Document delivered value/);
  assert.match(about, /communicate delivered operational value/);

  const audience = readSource("src/lib/seo/audience-content.ts");
  assert.match(
    audience,
    /Support recurring retainer relationships through proactive account management/,
  );

  const industry = readSource("src/lib/seo/industry-content.ts");
  assert.match(
    industry,
    /Improve visibility into engagement health before silent degradation/,
  );
  assert.match(
    industry,
    /Support recurring client relationships by surfacing accounts that may require attention/,
  );

  const billing = readSource("src/lib/docs/pages/account.ts");
  assert.match(
    billing,
    /Professional for growing teams that need client portal delivery, integrations, automation workflows/,
  );
  assert.doesNotMatch(billing, /Business for agencies requiring automation workflows/);

  const integrations = readSource("src/lib/docs/pages/platform.ts");
  assert.match(
    integrations,
    /Sign in with an account that has permission to manage integrations/,
  );

  const sla = readSource("src/lib/docs/pages/operations.ts");
  assert.match(sla, /monitoring targets/);
  assert.match(sla, /does not fulfill or guarantee legal contractual obligations/);

  const enterprise = readSource("src/app/(marketing)/enterprise/page.tsx");
  assert.match(enterprise, /EU-capable infrastructure/);
  assert.doesNotMatch(enterprise, /EU-friendly/);
});
