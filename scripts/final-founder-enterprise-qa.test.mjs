import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

function publicAssetExists(relativePath) {
  const fullPath = join(rootDir, "public", relativePath.replace(/^\//, ""));
  return existsSync(fullPath) && statSync(fullPath).size > 0;
}

// --- Public trust surfaces ---

test("public status sanitization excludes internal diagnostic labels", () => {
  const publicStatus = readSource("src/lib/marketing/public-status.ts");
  const statusPage = readSource("src/app/(marketing)/status/page.tsx");
  assert.doesNotMatch(publicStatus, /Development/);
  assert.match(publicStatus, /Not Enabled/);
  assert.doesNotMatch(statusPage, /getPlatformStatusSnapshot/);
  assert.match(statusPage, /filterPublicStatusComponents/);
});

test("marketing testimonials avoid fabricated customer claims", () => {
  const content = readSource("src/lib/marketing/content.ts");
  assert.match(content, /Representative priority/);
  assert.doesNotMatch(content, /Trusted by/i);
  assert.doesNotMatch(content, /Start free trial/i);
});

test("primary marketing CTAs use Create workspace language", () => {
  const cta = readSource("src/lib/marketing/cta.ts");
  const auth = readSource("src/lib/marketing/auth-context.ts");
  assert.match(cta, /Create workspace/);
  assert.match(auth, /Create workspace/);
});

// --- Plan and billing consistency ---

test("public plan comparison aligns priority support with enterprise only", () => {
  const content = readSource("src/lib/marketing/content.ts");
  const plans = readSource("src/lib/billing/plans.ts");
  const priorityRow = content.match(
    /\{ feature: "Priority support"[\s\S]*?\},/,
  )?.[0];
  assert.ok(priorityRow, "expected Priority support comparison row");
  assert.match(priorityRow, /enterprise: true/);
  assert.match(priorityRow, /business: "—"/);
  const businessBlock = plans.slice(plans.indexOf('key: "business"'));
  assert.doesNotMatch(businessBlock.slice(0, 600), /Priority support/);
});

test("self-serve plan prices match marketing copy", () => {
  const content = readSource("src/lib/marketing/content.ts");
  const plans = readSource("src/lib/billing/plans.ts");
  assert.match(content, /€149/);
  assert.match(content, /€499/);
  assert.match(content, /€1,499/);
  assert.match(plans, /priceMonthly: 149/);
  assert.match(plans, /priceMonthly: 499/);
  assert.match(plans, /priceMonthly: 1499/);
});

// --- Route integrity ---

test("company links register critical public marketing routes", () => {
  const links = readSource("src/lib/company/company-links.ts");
  const required = [
    "pricing",
    "features",
    "enterprise",
    "security",
    "status",
    "contact",
    "privacy",
    "terms",
    "imprint",
    "data-processing-agreement",
    "subprocessors",
    "acceptable-use",
    "security-policy",
  ];
  for (const segment of required) {
    assert.match(links, new RegExp(segment));
  }
  assert.match(links, /apiDocumentation: "\/api\/docs"/);
});

test("about and security pages link to /api/docs not stale paths only", () => {
  const about = readSource("src/app/(marketing)/about/page.tsx");
  const security = readSource("src/app/(marketing)/security/page.tsx");
  assert.match(about, /\/api\/docs/);
  assert.match(security, /\/api\/docs/);
});

// --- SEO and indexing ---

test("robots blocks private application routes", () => {
  const robots = readSource("src/lib/seo/robots.ts");
  const blocked = ["/dashboard", "/settings", "/client-portal", "/api/", "/clients", "/reports"];
  for (const prefix of blocked) {
    assert.match(robots, new RegExp(prefix.replace(/\//g, "\\/")));
  }
});

test("public favicon and manifest assets exist", () => {
  assert.ok(publicAssetExists("/favicon.ico"));
  const manifest = readSource("src/app/manifest.ts");
  assert.match(manifest, /export default function manifest/);
});

// --- Security hygiene on public pages ---

test("public status page does not expose environment variable names in customer copy", () => {
  const statusPage = readSource("src/app/(marketing)/status/page.tsx");
  const customerFacingStrings = statusPage.match(/detail:\s*"[^"]+"/g) ?? [];
  assert.ok(customerFacingStrings.length > 0);
  for (const line of customerFacingStrings) {
    assert.doesNotMatch(line, /OPENAI_API_KEY|STRIPE_SECRET_KEY|NEXT_PUBLIC_|process\.env/);
  }
});

test("marketing pages avoid exposing secret env key names in rendered copy", () => {
  const marketingFiles = [
    "src/app/(marketing)/page.tsx",
    "src/app/(marketing)/pricing/page.tsx",
    "src/app/(marketing)/features/page.tsx",
    "src/app/(marketing)/enterprise/page.tsx",
  ];
  for (const file of marketingFiles) {
    const source = readSource(file);
    assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE|STRIPE_SECRET_KEY|OPENAI_API_KEY/);
  }
});

// --- Auth form accessibility ---

test("signup and login forms retain autocomplete attributes", () => {
  const signup = readSource("src/components/auth/signup-form.tsx");
  const login = readSource("src/components/auth/login-form.tsx");
  assert.match(signup, /autoComplete="name"/);
  assert.match(signup, /autoComplete="email"/);
  assert.match(signup, /autoComplete="new-password"/);
  assert.match(login, /autoComplete="email"/);
  assert.match(login, /autoComplete="current-password"/);
});
