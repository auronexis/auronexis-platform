/**
 * B2B checkout identity / contracting hardening — source-contract tests.
 * Protects acknowledgement defaults, legal links, server enforcement, VAT format gate,
 * analytics non-leakage, and LIVE charging fail-closed.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("checkout dialog defaults B2B and Terms unchecked", () => {
  const grid = readSource("src/components/pricing/pricing-grid.tsx");
  assert.match(grid, /termsAccepted:\s*false/);
  assert.match(grid, /b2bEntrepreneurConfirmed:\s*false/);
  assert.doesNotMatch(grid, /b2bEntrepreneurConfirmed:\s*true/);
  assert.doesNotMatch(grid, /defaultChecked/);
});

test("checkout dialog shows org, recurring, Privacy, Refund, and soft B2B acknowledgement", () => {
  const dialog = readSource("src/components/billing/checkout-contract-summary-dialog.tsx");
  assert.match(dialog, /organizationName/);
  assert.match(dialog, /recurringLabel/);
  assert.match(dialog, /LEGAL_ROUTES\.privacy/);
  assert.match(dialog, /LEGAL_ROUTES\.refundPolicy/);
  assert.match(dialog, /LEGAL_ROUTES\.terms/);
  assert.match(dialog, /B2B_PURCHASE_ACKNOWLEDGEMENT_LABEL/);
  assert.doesNotMatch(dialog, /waive all consumer rights/i);
  assert.doesNotMatch(dialog, /Price \(VAT-inclusive list\)/);
  assert.match(dialog, /Catalog price/);
});

test("contracting summary requires organizationName and Mollie PSP (not MoR)", () => {
  const contracting = readSource("src/lib/billing/contracting.ts");
  assert.match(contracting, /organizationName/);
  assert.match(contracting, /pspName:\s*"Mollie"/);
  assert.match(contracting, /B2B_PURCHASE_ACKNOWLEDGEMENT_LABEL/);
  assert.match(contracting, /business or professional purposes/);
  assert.match(contracting, /buildCheckoutContractSummaryAcceptanceEvidence/);
  assert.doesNotMatch(contracting, /Merchant of Record/);
});

test("checkout action enforces contract server-side and persists identity + evidence", () => {
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /Contract acceptance is required before Mollie checkout/);
  assert.match(actions, /checkoutContractSchema/);
  assert.match(actions, /upsertOrganizationBillingIdentity/);
  assert.match(actions, /legalName/);
  assert.match(actions, /billingEmail/);
  assert.match(actions, /buildCheckoutContractSummaryAcceptanceEvidence/);
  assert.match(actions, /normalizeVatId/);
  assert.match(actions, /session\.organization\.id/);
  assert.match(actions, /getPlanByKey\(parsed\.data\)/);
  assert.doesNotMatch(actions, /amountMinor:\s*contract/);
});

test("VAT technical states distinguish format vs official validation", () => {
  const status = readSource("src/lib/billing/vat-id-status.ts");
  assert.match(status, /NOT_PROVIDED/);
  assert.match(status, /FORMAT_VALID/);
  assert.match(status, /OFFICIALLY_VALIDATED/);
  assert.match(status, /INVALID/);
  assert.match(status, /REVIEW_REQUIRED/);
  assert.match(status, /import "server-only"/);
});

test("pricing conversion analytics do not emit VAT or billing identity", () => {
  const grid = readSource("src/components/pricing/pricing-grid.tsx");
  assert.match(grid, /trackConversionEvent\("subscription_checkout_started"/);
  const analyticsBlock = grid.match(
    /trackConversionEvent\("subscription_checkout_started",\s*\{[\s\S]*?\}\)/,
  );
  assert.ok(analyticsBlock, "expected checkout started conversion event");
  assert.doesNotMatch(analyticsBlock[0], /vat/i);
  assert.doesNotMatch(analyticsBlock[0], /legalName|billingEmail|countryCode/);
  assert.match(analyticsBlock[0], /plan_tier/);
});

test("LIVE charging gate remains fail-closed", () => {
  const rollout = readSource("src/lib/billing/providers/mollie/rollout.ts");
  assert.match(rollout, /isMollieLiveChargingEnabled/);
  assert.match(rollout, /return false/);
});

test("signup B2B acknowledgement is unchecked and non-waive wording", () => {
  const signup = readSource("src/components/auth/signup-form.tsx");
  assert.match(signup, /b2bEntrepreneurConfirmed/);
  assert.doesNotMatch(signup, /defaultChecked/);
  assert.match(signup, /business or professional purposes/);
  assert.doesNotMatch(signup, /waive/);
});
