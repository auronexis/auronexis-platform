/**
 * FastSpring sole-provider regression suite (replaces the retired
 * scripts/paddle-*.test.mjs files after the Paddle runtime deletion).
 *
 * Proves: FastSpring is the sole active billing provider, no Paddle
 * checkout/SDK/route survives in `src/`, the public catalog has no
 * "starter" product path, live storefront helpers fail closed against a
 * test storefront, FastSpring webhook signature verification exists, and
 * CSP/vercel.json never allow paddle.com.
 *
 * Source-contract style via readSource — does not import server-only modules.
 */
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { pathExists, readSource, rootDir } from "./_test-helpers/read-source.mjs";

function listFilesRecursive(dir, results = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const next = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") {
        continue;
      }
      listFilesRecursive(next, results);
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      results.push(next);
    }
  }
  return results;
}

test("getActiveBillingProvider returns fastspring and never paddle/stripe", () => {
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /export function getActiveBillingProvider\(\)/);
  assert.match(provider, /return "fastspring"/);
  assert.doesNotMatch(provider, /return "paddle"/);
  assert.doesNotMatch(provider, /return "stripe"/);
});

test("no @paddle SDK imports remain anywhere in src/", () => {
  const srcRoot = join(rootDir, "src");
  const files = listFilesRecursive(srcRoot);
  const offenders = [];

  for (const file of files) {
    const contents = readSource(file.slice(rootDir.length + 1).replace(/\\/g, "/"));
    if (/from ["']@paddle\//.test(contents) || /require\(["']@paddle\//.test(contents)) {
      offenders.push(file);
    }
  }

  assert.deepEqual(offenders, [], `Unexpected @paddle imports: ${offenders.join(", ")}`);
});

test("no src/lib/paddle runtime directory and no /api/paddle routes remain", () => {
  assert.equal(pathExists("src/lib/paddle"), false);
  assert.equal(pathExists("src/app/api/paddle"), false);
  assert.equal(pathExists("src/app/api/paddle/webhook/route.ts"), false);
  assert.ok(pathExists("src/app/api/fastspring/webhook/route.ts"));
});

test("package.json has no @paddle dependencies", () => {
  const pkg = readSource("package.json");
  assert.doesNotMatch(pkg, /"@paddle\/paddle-js"/);
  assert.doesNotMatch(pkg, /"@paddle\/paddle-node-sdk"/);
});

test("canonical catalog has no starter product path", () => {
  const catalog = readSource("src/lib/billing/catalog.ts");
  assert.doesNotMatch(catalog, /"starter"/);
  assert.doesNotMatch(catalog, /productPath:\s*"starter"/);
});

test("public self-serve catalog is professional/business/enterprise only", () => {
  const catalog = readSource("src/lib/billing/catalog.ts");
  assert.match(catalog, /listPublicCatalogEntries/);

  const entries = [
    ...catalog.matchAll(/productPath:\s*"([^"]+)"[\s\S]*?visibility:\s*"(public|private)"/g),
  ].map((m) => ({ productPath: m[1], visibility: m[2] }));
  assert.equal(entries.length, 5, "expected exactly 5 catalog entries");

  const publicEntries = entries.filter((e) => e.visibility === "public").map((e) => e.productPath);
  const privateEntries = entries.filter((e) => e.visibility === "private").map((e) => e.productPath);

  assert.deepEqual(new Set(publicEntries), new Set(["professional", "business", "enterprise"]));
  assert.deepEqual(new Set(privateEntries), new Set(["founding-member", "pilot-client"]));
});

test("live storefront helper fails closed against a test storefront for production public checkout", () => {
  const storefront = readSource("src/lib/fastspring/storefront.ts");
  assert.match(storefront, /export function getLiveFastSpringStorefront/);
  assert.match(storefront, /isFastSpringTestStorefront\(normalized\)/);
  assert.match(storefront, /Public checkout requires a live storefront/);
  assert.match(storefront, /export function isFastSpringLiveCheckoutConfigured/);

  const checkout = readSource("src/lib/fastspring/checkout.ts");
  assert.match(checkout, /getLiveFastSpringStorefront/);
  assert.match(checkout, /process\.env\.NODE_ENV === "production"/);
  assert.match(checkout, /never falls back to a[\s\S]*?test storefront/);
  assert.match(checkout, /must never be set[\s\S]*?public\/customer-facing code path/);
});

test("FastSpring webhook signature verification is present and enforced", () => {
  const signature = readSource("src/lib/fastspring/signature.ts");
  assert.match(signature, /verifyFastSpringSignature/);
  assert.match(signature, /createHmac\("sha256"/);
  assert.match(signature, /timingSafeEqual/);

  const route = readSource("src/app/api/fastspring/webhook/route.ts");
  assert.match(route, /verifyFastSpringSignature/);
  assert.match(route, /Missing X-FS-Signature header/);
  assert.match(route, /Invalid FastSpring signature/);
  assert.match(route, /ensureFastSpringIdempotency/);
});

test("CSP has no paddle.com in src/lib/security/csp.ts", () => {
  const csp = readSource("src/lib/security/csp.ts");
  assert.doesNotMatch(csp, /paddle\.com/i);
  assert.match(csp, /onfastspring\.com/);
});

test("vercel.json CSP has no paddle.com", () => {
  const vercel = readSource("vercel.json");
  assert.doesNotMatch(vercel, /paddle\.com/i);
  assert.match(vercel, /onfastspring\.com/);
});

test("checkout server action never imports deleted paddle modules", () => {
  const actions = readSource("src/lib/billing/actions.ts");
  assert.doesNotMatch(actions, /@\/lib\/paddle/);
  assert.match(actions, /createFastSpringCheckoutPayloadForPlan/);
});

test("customer portal never falls back to Paddle", () => {
  const portal = readSource("src/lib/billing/customer-portal.ts");
  assert.match(portal, /never falls back to Paddle/);
  assert.doesNotMatch(portal, /@\/lib\/paddle/);
});
