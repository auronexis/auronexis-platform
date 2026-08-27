/**
 * Issue B — Pilot / Founding eligibility, access & paid-customer exclusion.
 *
 * Behavioral tests (executed functions) + wiring contracts.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/pilot-founding-eligibility.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const eligibility = await import("../src/lib/sales/pilot-eligibility.ts");
const catalog = await import("../src/lib/billing/catalog.ts");
const founding = await import("../src/lib/sales/founding-program.ts");

const evaluatePilotApplicationEligibility = eligibility.evaluatePilotApplicationEligibility;
const PAID_CUSTOMER_PILOT_BLOCK_MESSAGE = eligibility.PAID_CUSTOMER_PILOT_BLOCK_MESSAGE;
const {
  getCatalogEntryByInternalKey,
  listPublicCatalogEntries,
  listPrivateCatalogEntries,
  isPublicCatalogProductPath,
} = catalog;
const { FOUNDING_CUSTOMER_LIMIT } = founding;

test("anonymous prospects are eligible for Pilot application", () => {
  const result = evaluatePilotApplicationEligibility({
    hasAuthenticatedOrganization: false,
    isPaidAccess: false,
  });
  assert.equal(result.allowed, true);
});

test("authenticated unpaid organizations remain eligible", () => {
  const result = evaluatePilotApplicationEligibility({
    hasAuthenticatedOrganization: true,
    isPaidAccess: false,
  });
  assert.equal(result.allowed, true);
});

test("authenticated paid access (Starter/Pro/Business usable) is denied", () => {
  const result = evaluatePilotApplicationEligibility({
    hasAuthenticatedOrganization: true,
    isPaidAccess: true,
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, PAID_CUSTOMER_PILOT_BLOCK_MESSAGE);
});

test("anonymous isPaidAccess flag is ignored (no session → allow)", () => {
  // Defense: never invent paid state for logged-out visitors.
  const result = evaluatePilotApplicationEligibility({
    hasAuthenticatedOrganization: false,
    isPaidAccess: true,
  });
  assert.equal(result.allowed, true);
});

test("submitPilotApplication enforces eligibility before persist/notify", () => {
  const capture = readSource("src/lib/sales/capture-actions.ts");
  const form = readSource("src/components/marketing/pilot-application-form.tsx");
  const page = readSource("src/app/(marketing)/pilot-program/page.tsx");

  assert.match(capture, /evaluatePilotApplicationEligibility/);
  assert.match(capture, /resolveOrganizationEntitlements/);
  assert.match(capture, /getSession/);
  assert.match(capture, /if\s*\(\s*!eligibility\.allowed\s*\)/);

  // Eligibility must run before persistInboundLead for the pilot path.
  const pilotFn = capture.slice(capture.indexOf("export async function submitPilotApplication"));
  const eligibilityIdx = pilotFn.indexOf("evaluatePilotApplicationEligibility");
  const persistIdx = pilotFn.indexOf("persistInboundLead");
  const notifyIdx = pilotFn.indexOf('source: "pilot"');
  assert.ok(eligibilityIdx >= 0, "eligibility call required");
  assert.ok(persistIdx > eligibilityIdx, "eligibility before persist");
  assert.ok(notifyIdx > eligibilityIdx, "pilot source after eligibility");

  // Rejected path returns error — does not call persist on deny.
  assert.match(pilotFn, /return \{\s*error:\s*eligibility\.reason\s*\}/);

  // Issue A rich fields still present on eligible path.
  for (const field of [
    "companySize:",
    "website:",
    "industry:",
    "employeeCount:",
    "painPoints:",
    "message:",
  ]) {
    assert.match(pilotFn, new RegExp(field.replace(":", "\\s*:")));
  }
  assert.match(pilotFn, /inboxKey:\s*"sales"/);

  assert.match(form, /blockedReason/);
  assert.match(page, /evaluatePilotApplicationEligibility/);
  assert.match(page, /blockedReason/);
});

test("Founding enrollment is operator-only (sales manage) — no public self-enroll", () => {
  const actions = readSource("src/lib/sales/actions.ts");
  const detail = readSource("src/components/sales/sales-lead-detail.tsx");
  const capture = readSource("src/lib/sales/capture-actions.ts");

  const enrollFn = actions.slice(actions.indexOf("export async function enrollFoundingCustomer"));
  assert.match(enrollFn, /requireSession/);
  assert.match(enrollFn, /requireModulePermissionSafe\(session\.role,\s*"sales",\s*"manage"\)/);
  assert.match(enrollFn, /founding_program_enrollments/);
  assert.match(detail, /enrollFoundingCustomer/);
  assert.doesNotMatch(capture, /enrollFoundingCustomer|founding_program_enrollments/);
  assert.equal(FOUNDING_CUSTOMER_LIMIT, 10);
});

test("Pilot and Founding catalog entries are private with planKey null", () => {
  const pilot = getCatalogEntryByInternalKey("pilot");
  const foundingEntry = getCatalogEntryByInternalKey("founding");

  assert.ok(pilot);
  assert.ok(foundingEntry);
  assert.equal(pilot.visibility, "private");
  assert.equal(foundingEntry.visibility, "private");
  assert.equal(pilot.planKey, null);
  assert.equal(foundingEntry.planKey, null);
  assert.equal(pilot.productPath, "pilot-client");
  assert.equal(foundingEntry.productPath, "founding-member");

  assert.equal(isPublicCatalogProductPath("pilot-client"), false);
  assert.equal(isPublicCatalogProductPath("founding-member"), false);

  const publicPaths = listPublicCatalogEntries().map((e) => e.productPath);
  assert.ok(!publicPaths.includes("pilot-client"));
  assert.ok(!publicPaths.includes("founding-member"));
  assert.ok(publicPaths.includes("professional"));
  assert.ok(publicPaths.includes("business"));

  const privatePaths = listPrivateCatalogEntries().map((e) => e.productPath);
  assert.ok(privatePaths.includes("pilot-client"));
  assert.ok(privatePaths.includes("founding-member"));
});

test("public Mollie checkout cannot purchase Pilot or Founding", () => {
  const checkoutSource = readSource("src/lib/billing/providers/mollie/checkout.ts");
  const actions = readSource("src/lib/billing/actions.ts");
  const productionCheckout = readSource("src/lib/billing/providers/mollie/production-checkout.ts");

  assert.match(
    checkoutSource,
    /MOLLIE_SELF_SERVE_PLAN_KEYS\s*=\s*\[\s*"professional"\s*,\s*"business"\s*\]/,
  );
  assert.doesNotMatch(checkoutSource, /["']pilot["']/);
  assert.doesNotMatch(checkoutSource, /["']founding["']/);
  assert.doesNotMatch(checkoutSource, /pilot-client|founding-member/);

  assert.match(productionCheckout, /isMollieSelfServePlanKey/);
  assert.match(
    productionCheckout,
    /Enterprise and invite-only plans are not available via Mollie self-serve checkout/,
  );

  assert.match(
    actions,
    /planKeySchema\s*=\s*z\.enum\(\["starter",\s*"professional",\s*"business",\s*"enterprise"\]\)/,
  );
  assert.doesNotMatch(actions, /"pilot"|"founding"|"pilot-client"|"founding-member"/);

  // Catalog planKey:null means invite-only programs are not entitlement-driving checkout SKUs.
  assert.equal(getCatalogEntryByInternalKey("pilot")?.planKey, null);
  assert.equal(getCatalogEntryByInternalKey("founding")?.planKey, null);
});
