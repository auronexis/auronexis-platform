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

test("primary marketing CTAs point to the free trial signup", () => {
  const cta = readSource("src/lib/marketing/cta.ts");
  const auth = readSource("src/lib/marketing/auth-context.ts");
  assert.match(cta, /label: "Start 7-day free trial",\s*href: "\/signup"/);
  assert.match(auth, /signupHref: "\/signup",\s*signupLabel: "Start free trial"/);
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
  // Plan prices are derived from the price catalog (minor units) — see src/lib/billing/plans.ts.
  const catalog = readSource("src/lib/billing/price-catalog.ts");
  assert.match(content, /€179/);
  assert.match(content, /€599/);
  assert.match(content, /€1,799/);
  assert.match(catalog, /amountMinor: 17_900/);
  assert.match(catalog, /amountMinor: 59_900/);
  assert.match(catalog, /amountMinor: 179_900/);
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
  assert.match(links, /apiDocumentation: "\/docs\/api"/);
});

test("about and security pages link to /api/docs not stale paths only", () => {
  const about = readSource("src/app/(marketing)/about/page.tsx");
  const security = readSource("src/app/(marketing)/security/page.tsx");
  assert.match(about, /\/docs\/api/);
  assert.match(security, /\/docs\/api/);
});

// --- SEO and indexing ---

test("robots blocks private application routes", () => {
  const robots = readSource("src/lib/seo/robots.ts");
  const routes = readSource("src/lib/seo/private-routes.ts");
  assert.match(robots, /PRIVATE_ROUTE_PREFIXES/);
  for (const prefix of ["/dashboard", "/settings", "/client-portal", "/api/", "/clients", "/reports"]) {
    assert.match(routes, new RegExp(prefix.replace(/\//g, "\\/")));
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
  const publicStatus = readSource("src/lib/marketing/public-status.ts");
  const statusContent = readSource("src/lib/marketing/content.ts");
  const customerFacingStrings = [
    ...(publicStatus.match(/detail:\s*"[^"]+"/g) ?? []),
    ...(statusContent.match(/detail:\s*"[^"]+"/g) ?? []),
  ];
  assert.ok(customerFacingStrings.length > 0);
  for (const line of customerFacingStrings) {
    assert.doesNotMatch(line, /OPENAI_API_KEY|STRIPE_SECRET_KEY|NEXT_PUBLIC_|process\.env/);
  }
  assert.doesNotMatch(statusPage, /OPENAI_API_KEY|STRIPE_SECRET_KEY|SUPABASE_SERVICE_ROLE/);
  assert.doesNotMatch(publicStatus, /process\.env\.(OPENAI|STRIPE|SUPABASE|MOLLIE)/);
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
