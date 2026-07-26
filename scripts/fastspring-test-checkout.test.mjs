import assert from "node:assert/strict";
import test from "node:test";
import { pathExists, readSource } from "./_test-helpers/read-source.mjs";

/**
 * FastSpring product mapping + TEST checkout — source-contract tests.
 * Does not import server-only modules.
 */

const ALLOWED_PATHS = [
  "professional",
  "business",
  "enterprise",
  "founding-member",
  "pilot-client",
];

const PATH_TO_PLAN = {
  professional: "professional",
  business: "business",
  enterprise: "enterprise",
  "founding-member": "founding",
  "pilot-client": "pilot",
};

function isAllowedPath(value) {
  return ALLOWED_PATHS.includes(String(value ?? "").trim().toLowerCase());
}

function mapProduct(path) {
  const key = String(path ?? "").trim().toLowerCase();
  return PATH_TO_PLAN[key] ?? null;
}

function buildCheckoutTags({ organizationId, userId, internalPlan }) {
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(organizationId)) {
    throw new Error("Invalid organization_id for FastSpring checkout tags.");
  }
  if (!UUID_RE.test(userId)) {
    throw new Error("Invalid user_id for FastSpring checkout tags.");
  }
  if (!internalPlan) {
    throw new Error("Invalid internal_plan for FastSpring checkout tags.");
  }
  return {
    organization_id: organizationId,
    user_id: userId,
    internal_plan: internalPlan,
  };
}

function extractOrganizationIdCandidate({ tags = {}, customLookupId = null } = {}) {
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const fromTag =
    tags.organization_id || tags.organizationId || tags.auroranexis_organization_id || null;
  if (fromTag && UUID_RE.test(fromTag)) return fromTag;
  if (customLookupId && UUID_RE.test(customLookupId)) return customLookupId;
  return null;
}

function buildTestStorefront(storeId) {
  return `${storeId}.test.onfastspring.com/popup-defaultB2B`;
}

test("product path allowlist is exactly the five FastSpring paths", () => {
  const catalog = readSource("src/lib/billing/catalog.ts");
  const products = readSource("src/lib/fastspring/products.ts");
  for (const path of ALLOWED_PATHS) {
    assert.match(catalog, new RegExp(`"${path}"`));
    assert.equal(isAllowedPath(path), true);
  }
  assert.equal(isAllowedPath("starter"), false);
  assert.equal(isAllowedPath("unknown"), false);
  assert.doesNotMatch(catalog, /"starter"/);
  assert.match(catalog, /FASTSPRING_PRODUCT_PATHS/);
  assert.match(products, /FASTSPRING_PRODUCT_PATHS/);
  assert.match(products, /@\/lib\/billing\/catalog/);
});

test("product mapping covers display names and internal plans", () => {
  assert.equal(mapProduct("professional"), "professional");
  assert.equal(mapProduct("business"), "business");
  assert.equal(mapProduct("enterprise"), "enterprise");
  assert.equal(mapProduct("founding-member"), "founding");
  assert.equal(mapProduct("pilot-client"), "pilot");
  assert.equal(mapProduct("starter"), null);

  const catalog = readSource("src/lib/billing/catalog.ts");
  const products = readSource("src/lib/fastspring/products.ts");
  assert.match(catalog, /displayName: "Professional"/);
  assert.match(catalog, /displayName: "Business"/);
  assert.match(catalog, /displayName: "Enterprise"/);
  assert.match(catalog, /displayName: "Founding Partner"/);
  assert.match(catalog, /displayName: "Pilot Client"/);
  assert.match(catalog, /visibility: "private"/);
  assert.match(products, /listPublicFastSpringProductPaths/);
});

test("public vs private plan visibility preserves Pilot and Founding as private", () => {
  const catalog = readSource("src/lib/billing/catalog.ts");
  assert.match(
    catalog,
    /productPath: "founding-member"[\s\S]*?visibility: "private"/,
  );
  assert.match(
    catalog,
    /productPath: "pilot-client"[\s\S]*?visibility: "private"/,
  );
  assert.match(
    catalog,
    /productPath: "professional"[\s\S]*?visibility: "public"/,
  );
});

test("deterministic organization metadata generation uses organization_id tag", () => {
  const orgId = "11111111-1111-4111-8111-111111111111";
  const userId = "22222222-2222-4222-8222-222222222222";
  const tags = buildCheckoutTags({
    organizationId: orgId,
    userId,
    internalPlan: "professional",
  });
  assert.deepEqual(tags, {
    organization_id: orgId,
    user_id: userId,
    internal_plan: "professional",
  });

  const tagsSource = readSource("src/lib/fastspring/checkout-tags.ts");
  assert.match(tagsSource, /organization_id/);
  assert.match(tagsSource, /user_id/);
  assert.match(tagsSource, /internal_plan/);
  assert.match(tagsSource, /fastspring\.builder\.tag/);
});

test("webhook org matching accepts checkout organization_id tags", () => {
  const orgId = "11111111-1111-4111-8111-111111111111";
  assert.equal(
    extractOrganizationIdCandidate({ tags: { organization_id: orgId } }),
    orgId,
  );
  assert.equal(extractOrganizationIdCandidate({ tags: { organization_id: "not-a-uuid" } }), null);
  assert.equal(extractOrganizationIdCandidate({ tags: {} }), null);

  const matching = readSource("src/lib/fastspring/org-matching.ts");
  assert.match(matching, /tags\.organization_id/);
  assert.doesNotMatch(matching, /contact\.email|buyer\.email/);
});

test("FastSpring test checkout configuration uses popup-defaultB2B and test storefront", () => {
  assert.equal(
    buildTestStorefront("auroranexis"),
    "auroranexis.test.onfastspring.com/popup-defaultB2B",
  );
  assert.match(buildTestStorefront("auroranexis"), /\.test\.onfastspring\.com/);
  assert.doesNotMatch(buildTestStorefront("auroranexis"), /(?<!test)\.onfastspring\.com\/popup/);

  const types = readSource("src/lib/fastspring/test-checkout-types.ts");
  const server = readSource("src/lib/fastspring/test-checkout.ts");
  assert.match(types, /popup-defaultB2B/);
  assert.match(types, /mode: "test"/);
  assert.match(types, /\.test\.onfastspring\.com/);
  assert.match(types, /sbl\.onfastspring\.com\/sbl\/1\.0\.6/);
  assert.match(server, /FASTSPRING_STORE_ID/);
  assert.match(server, /createFastSpringTestCheckoutPayload/);
  assert.match(types, /Always test-mode for this integration phase/);
});

test("test checkout action validates allowlist and requires settings managers", () => {
  const actions = readSource("src/lib/fastspring/test-checkout-actions.ts");
  assert.match(actions, /canManageOrganizationSettings/);
  assert.match(actions, /normalizeFastSpringProductPath/);
  assert.match(actions, /Invalid FastSpring product path/);
  assert.match(actions, /ACTION_DENIED_MESSAGE/);
  assert.match(actions, /requireSession/);
});

test("unauthorized and invalid product path are rejected by action contract", () => {
  const actions = readSource("src/lib/fastspring/test-checkout-actions.ts");
  assert.match(
    actions,
    /if \(!canManageOrganizationSettings\(session\)\) \{\s*return \{ error: ACTION_DENIED_MESSAGE \};/s,
  );
  assert.match(
    actions,
    /if \(!normalizedPath\) \{\s*return \{ error: "Invalid FastSpring product path\." \};/s,
  );
  assert.equal(isAllowedPath("not-a-real-path"), false);
  assert.equal(mapProduct("not-a-real-path"), null);
});

test("protected FastSpring test page exists and stays owner/admin gated", () => {
  assert.ok(pathExists("src/app/(dashboard)/settings/billing/fastspring-test/page.tsx"));
  const page = readSource("src/app/(dashboard)/settings/billing/fastspring-test/page.tsx");
  assert.match(page, /canManageOrganizationSettings/);
  assert.match(page, /FastSpring Test Checkout/);
  assert.match(page, /TEST MODE/);
  assert.match(page, /redirect\("\/dashboard"\)/);
  assert.match(page, /requireModuleAccess\("settings"\)/);
});

test("client panel uses Store Builder tag then add then checkout", () => {
  const panel = readSource("src/components/settings/fastspring-test-checkout-panel.tsx");
  assert.match(panel, /builder\.reset\(\)/);
  assert.match(panel, /builder\.tag\(/);
  assert.match(panel, /organization_id:/);
  assert.match(panel, /builder\.add\(/);
  assert.match(panel, /builder\.checkout\(\)/);
  assert.match(panel, /dataset\.storefront/);
  assert.match(panel, /createFastSpringTestCheckoutAction/);
  assert.doesNotMatch(panel, /FASTSPRING_API_PASSWORD|WEBHOOK_SECRET/);
});

test("active billing provider is fastspring and sync refuses usable paddle overwrite", () => {
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /return "fastspring"/);
  assert.doesNotMatch(provider, /return "paddle"/);
  assert.doesNotMatch(provider, /return "stripe"/);

  const sync = readSource("src/lib/fastspring/sync.ts");
  assert.match(sync, /usable_paddle_subscription_present/);
  assert.match(sync, /refusing to overwrite usable Paddle/);
});

test("CSP and env example allow FastSpring Store Builder without exposing secrets", () => {
  const csp = readSource("src/lib/security/csp.ts");
  const vercel = readSource("vercel.json");
  const envExample = readSource(".env.example");
  assert.match(csp, /sbl\.onfastspring\.com/);
  assert.match(csp, /\*\.onfastspring\.com/);
  assert.match(vercel, /sbl\.onfastspring\.com/);
  assert.match(vercel, /\*\.onfastspring\.com/);
  assert.match(envExample, /^FASTSPRING_STORE_ID=/m);
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_FASTSPRING/);
});
