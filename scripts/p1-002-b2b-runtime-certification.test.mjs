/**
 * P1-002 B2B runtime certification matrix — tax A–G, address gate, Free, LIVE false.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/p1-002-b2b-runtime-certification.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const tax = await import("../src/lib/billing/tax-policy.ts");
const buyerSnap = await import("../src/lib/billing/buyer-invoice-snapshot.ts");
const legendMod = await import("../src/lib/billing/reverse-charge-legend.ts");
const nonEuLegend = await import("../src/lib/billing/non-eu-b2b-legend.ts");
const taxes = await import("../src/lib/billing/taxes.ts");
const companyInfo = await import("../src/lib/company/company-information.ts");
const rollout = await import("../src/lib/billing/providers/mollie/rollout.ts");
const contracting = await import("../src/lib/billing/contracting.ts");
const dpaDoc = await import("../src/lib/company/dpa-document.ts");
const preview = await import("../src/lib/billing/sales-invoice-preview.ts");

const { determineTaxPolicy } = tax;
const {
  getMissingBuyerInvoiceFields,
  isBuyerInvoiceAddressComplete,
  buildBuyerInvoiceSnapshot,
} = buyerSnap;
const { REVERSE_CHARGE_LEGEND } = legendMod;
const { calculateVatInclusiveBreakdown } = taxes;
const { COMPANY_INFORMATION } = companyInfo;
const { isMollieLiveChargingEnabled } = rollout;
const { DPA_DOCUMENT_VERSION, B2B_ONLY_CHECKOUT_BLOCK_MESSAGE } = contracting;
const { buildDpaPageSections } = dpaDoc;
const { buildPreviewSalesInvoice } = preview;

test("A — DE + valid B2B → STANDARD_DOMESTIC_VAT 19%, calc agrees", () => {
  const determination = determineTaxPolicy({
    customerCountryCode: "DE",
    vatId: null,
    viesStatus: "not_checked",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(determination.outcome, "STANDARD_DOMESTIC_VAT");
  assert.equal(determination.vatRateBps, 1900);
  assert.equal(determination.blocksCheckout, false);
  const breakdown = calculateVatInclusiveBreakdown({
    grossMinor: 59900,
    determination,
  });
  assert.equal(breakdown.netMinor + breakdown.vatMinor, breakdown.grossMinor);
  assert.equal(breakdown.netMinor, 50336);
  assert.equal(breakdown.vatMinor, 9564);
});

test("B — EU + valid B2B + VIES → reverse charge, statutory DE wording", () => {
  const determination = determineTaxPolicy({
    customerCountryCode: "FR",
    vatId: "FR12345678901",
    viesStatus: "valid",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(determination.outcome, "REVERSE_CHARGE");
  assert.equal(determination.blocksCheckout, false);
  const breakdown = calculateVatInclusiveBreakdown({
    grossMinor: 59900,
    determination,
  });
  assert.equal(breakdown.vatMinor, 0);
  assert.match(REVERSE_CHARGE_LEGEND, /Steuerschuldnerschaft des Leistungsempfängers/);
  const { invoice } = buildPreviewSalesInvoice("business", "fr");
  assert.equal(invoice.vatMinor, 0);
  assert.ok(invoice.sellerSnapshot?.vatId);
  assert.ok(invoice.buyerVatId);
  assert.equal(invoice.taxNote, REVERSE_CHARGE_LEGEND);
});

test("C — NON-EU + B2B evidence → place of supply; country alone insufficient", () => {
  const blocked = determineTaxPolicy({
    customerCountryCode: "US",
    vatId: null,
    viesStatus: "not_checked",
    isB2bEntrepreneurConfirmed: false,
  });
  assert.equal(blocked.blocksCheckout, true);
  assert.notEqual(blocked.outcome, "NON_EU_B2B_PLACE_OF_SUPPLY");

  const allowed = determineTaxPolicy({
    customerCountryCode: "US",
    vatId: null,
    viesStatus: "skipped",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(allowed.outcome, "NON_EU_B2B_PLACE_OF_SUPPLY");
  assert.equal(allowed.blocksCheckout, false);
  const breakdown = calculateVatInclusiveBreakdown({
    grossMinor: 59900,
    determination: allowed,
  });
  assert.equal(breakdown.vatMinor, 0);
  assert.match(nonEuLegend.NON_EU_B2B_LEGEND_EN, /3a/);
});

test("D/E — B2C / unknown business status fail closed", () => {
  for (const country of ["DE", "FR", "US", null]) {
    const result = determineTaxPolicy({
      customerCountryCode: country,
      vatId: country === "FR" ? "FR12345678901" : null,
      viesStatus: country === "FR" ? "valid" : "not_checked",
      isB2bEntrepreneurConfirmed: false,
    });
    assert.equal(result.outcome, "UNKNOWN_BLOCK_CHECKOUT");
    assert.equal(result.blocksCheckout, true);
    assert.equal(result.reasonCode, "b2b_confirmation_required");
  }
  assert.match(B2B_ONLY_CHECKOUT_BLOCK_MESSAGE, /business customers only/i);
});

test("F — malformed / unverified EU VAT fail closed", () => {
  for (const viesStatus of ["invalid", "unavailable", "not_checked", "skipped"]) {
    const result = determineTaxPolicy({
      customerCountryCode: "NL",
      vatId: "NL123456789B01",
      viesStatus,
      isB2bEntrepreneurConfirmed: true,
    });
    assert.equal(result.blocksCheckout, true);
    assert.equal(result.outcome, "UNKNOWN_BLOCK_CHECKOUT");
  }
  const missingVat = determineTaxPolicy({
    customerCountryCode: "AT",
    vatId: null,
    viesStatus: "not_checked",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(missingVat.reasonCode, "eu_vat_id_required");
});

test("G — OTHER / unknown country at checkout maps fail closed (no silent NON-EU)", () => {
  const unknown = determineTaxPolicy({
    customerCountryCode: null,
    vatId: null,
    viesStatus: "not_checked",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(unknown.blocksCheckout, true);
  assert.equal(unknown.reasonCode, "customer_country_unknown");
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /countryCode === "OTHER" \? null/);
});

test("Buyer address required for German B2B invoice issuance", () => {
  const incomplete = buildBuyerInvoiceSnapshot({
    organizationId: "org",
    legalName: "Buyer GmbH",
    billingEmail: "a@b.co",
    countryCode: "DE",
    addressLine1: null,
    addressLine2: null,
    postalCode: null,
    city: null,
    vatId: null,
    vatIdNormalized: null,
    viesStatus: null,
    viesCheckedAt: null,
    updatedAt: "2026-08-31T00:00:00.000Z",
  });
  assert.equal(isBuyerInvoiceAddressComplete(incomplete), false);
  assert.deepEqual(getMissingBuyerInvoiceFields(incomplete).sort(), [
    "addressLine1",
    "city",
    "postalCode",
  ]);

  const complete = buildBuyerInvoiceSnapshot({
    organizationId: "org",
    legalName: "Buyer GmbH",
    billingEmail: "a@b.co",
    countryCode: "DE",
    addressLine1: "Im Malerwinkel 4",
    addressLine2: null,
    postalCode: "71566",
    city: "Althütte",
    vatId: "DE449657077",
    vatIdNormalized: "DE449657077",
    viesStatus: null,
    viesCheckedAt: null,
    updatedAt: "2026-08-31T00:00:00.000Z",
  });
  assert.equal(isBuyerInvoiceAddressComplete(complete), true);

  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /addressLine1:\s*requiredTrimmed/);
  assert.match(actions, /postalCode:\s*requiredTrimmed/);
  assert.match(actions, /city:\s*requiredTrimmed/);
  const issue = readSource("src/lib/billing/sales-invoice.ts");
  assert.match(issue, /buyer invoice address incomplete/);
  const fromMollie = readSource("src/lib/billing/sales-invoice-from-mollie.ts");
  assert.match(fromMollie, /buyer invoice address incomplete/);
  assert.match(fromMollie, /B2B entrepreneur acceptance missing/);
  const dialog = readSource("src/components/billing/checkout-contract-summary-dialog.tsx");
  assert.match(dialog, /Billing street address/);
  assert.match(dialog, /Postal code/);
});

test("Seller identity locked + Mollie PSP only", () => {
  assert.equal(COMPANY_INFORMATION.legalName, "Auroranexis AI Solutions");
  assert.equal(COMPANY_INFORMATION.owner, "István-Tamás Schneller");
  assert.equal(COMPANY_INFORMATION.businessFormGerman, "Einzelunternehmen");
  assert.equal(COMPANY_INFORMATION.street, "Im Malerwinkel 4");
  assert.equal(COMPANY_INFORMATION.postalCode, "71566");
  assert.equal(COMPANY_INFORMATION.city, "Althütte");
  assert.equal(COMPANY_INFORMATION.vatId, "DE449657077");
  const legal = readSource("src/lib/company/legal-content.ts");
  assert.match(legal, /payment service provider, Mollie/);
  assert.doesNotMatch(legal, /Merchant of Record/);
});

test("DPA Art.28 version + annexes; LIVE charging false; Free unpaid", () => {
  assert.equal(DPA_DOCUMENT_VERSION, "dpa-2026-08-29-v1");
  const headings = buildDpaPageSections()
    .map((s) => s.heading)
    .join("\n");
  assert.match(headings, /ANNEX I/);
  assert.match(headings, /ANNEX II/);
  assert.match(headings, /ANNEX III/);
  assert.match(headings, /ANNEX IV/);
  assert.equal(isMollieLiveChargingEnabled(), false);
  const resolver = readSource("src/lib/entitlements/resolver.ts");
  assert.match(resolver, /planLabel:\s*"Free"/);
  assert.match(resolver, /fallbackPath:\s*"minimal_access"/);
  const env = readSource(".env.example");
  assert.match(env, /MOLLIE_LIVE_CHARGING_ENABLED=false/);
});

test("Invoice email idempotency key + e-invoice roadmap present", () => {
  const template = readSource("src/lib/email/templates/sales-invoice.ts");
  assert.match(template, /sales_invoice:\$\{id\}:issued|sales_invoice:\`\$\{|sales_invoice:\$\{/);
  assert.match(template, /:issued/);
  assert.equal(
    readSource("docs/billing/e-invoice-readiness-roadmap.md").includes("XRechnung"),
    true,
  );
  assert.match(readSource("docs/billing/e-invoice-readiness-roadmap.md"), /NOT IMPLEMENTED|NO/);
});
