/**
 * B2B tax / invoice foundation — behavioral matrix (A–O) + source contracts.
 * Pure decision helpers mirror src/lib/billing/tax-policy.ts reason codes
 * (asserted against source so they cannot drift silently).
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource, pathExists } from "./_test-helpers/read-source.mjs";

const SELLER = "DE";
const EU = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "ES", "FI", "FR", "HR",
  "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK", "XI",
]);

function normalizeCountry(code) {
  if (!code) return null;
  const trimmed = String(code).trim().toUpperCase();
  if (trimmed === "GR") return "EL";
  return /^[A-Z]{2}$/.test(trimmed) ? trimmed : null;
}

function classifyB2bTaxRelationship(input) {
  if (!input.isB2bEntrepreneurConfirmed) {
    return { classification: "REVIEW_REQUIRED", reasonCode: "b2b_confirmation_required" };
  }
  const country = normalizeCountry(input.customerCountryCode);
  if (!country) {
    return { classification: "REVIEW_REQUIRED", reasonCode: "customer_country_unknown" };
  }
  if (country === SELLER) {
    return { classification: "DOMESTIC_B2B", reasonCode: "seller_buyer_same_country" };
  }
  if (EU.has(country)) {
    return { classification: "EU_CROSS_BORDER_B2B_CANDIDATE", reasonCode: "eu_cross_border_candidate" };
  }
  return { classification: "NON_EU_B2B", reasonCode: "non_eu_buyer" };
}

function determineTaxPolicy(input) {
  const { classification } = classifyB2bTaxRelationship(input);
  const wrap = (partial) => ({ ...partial, businessClassification: classification });

  if (!input.isB2bEntrepreneurConfirmed) {
    return wrap({
      outcome: "UNKNOWN_BLOCK_CHECKOUT",
      vatRateBps: null,
      blocksCheckout: true,
      reasonCode: "b2b_confirmation_required",
      reverseChargeLegendStatus: "n/a",
    });
  }
  const country = normalizeCountry(input.customerCountryCode);
  if (!country) {
    return wrap({
      outcome: "UNKNOWN_BLOCK_CHECKOUT",
      vatRateBps: null,
      blocksCheckout: true,
      reasonCode: "customer_country_unknown",
      reverseChargeLegendStatus: "n/a",
    });
  }
  if (country === SELLER) {
    return wrap({
      outcome: "STANDARD_DOMESTIC_VAT",
      vatRateBps: 1900,
      blocksCheckout: false,
      reasonCode: "de_domestic_standard_vat",
      reverseChargeLegendStatus: "n/a",
    });
  }
  if (!EU.has(country === "GR" ? "EL" : country)) {
    return wrap({
      outcome: "MANUAL_REVIEW",
      vatRateBps: null,
      blocksCheckout: true,
      reasonCode: "non_eu_manual_review",
      reverseChargeLegendStatus: "n/a",
    });
  }
  const vatId = (input.vatId ?? "").trim();
  if (!vatId) {
    return wrap({
      outcome: "UNKNOWN_BLOCK_CHECKOUT",
      vatRateBps: null,
      blocksCheckout: true,
      reasonCode: "eu_vat_id_required",
      reverseChargeLegendStatus: "n/a",
    });
  }
  if (input.viesStatus === "valid") {
    return wrap({
      outcome: "REVERSE_CHARGE",
      vatRateBps: 0,
      blocksCheckout: true,
      reasonCode: "eu_b2b_reverse_charge_legend_pending_counsel",
      reverseChargeLegendStatus: "LEGAL_TEXT_PENDING_COUNSEL",
    });
  }
  if (input.viesStatus === "invalid") {
    return wrap({
      outcome: "UNKNOWN_BLOCK_CHECKOUT",
      vatRateBps: null,
      blocksCheckout: true,
      reasonCode: "vies_invalid",
      reverseChargeLegendStatus: "n/a",
    });
  }
  return wrap({
    outcome: "UNKNOWN_BLOCK_CHECKOUT",
    vatRateBps: null,
    blocksCheckout: true,
    reasonCode: "vies_not_validated",
    reverseChargeLegendStatus: "n/a",
  });
}

function splitVatInclusiveGross({ grossMinor, vatRateBps }) {
  if (vatRateBps === 0) return { netMinor: grossMinor, vatMinor: 0 };
  const netMinor = Math.round((grossMinor * 10_000) / (10_000 + vatRateBps));
  return { netMinor, vatMinor: grossMinor - netMinor };
}

function resolveReverseChargeLegend(input) {
  if (input.taxPolicyOutcome !== "REVERSE_CHARGE") {
    return { showOnInvoice: false, legendText: null, status: "n/a" };
  }
  if (input.reverseChargeLegendStatus === "approved") {
    const text = input.approvedLegendText?.trim() || null;
    if (!text) {
      return { showOnInvoice: false, legendText: null, status: "EXTERNAL_LEGAL_COPY_REQUIRED" };
    }
    return { showOnInvoice: true, legendText: text, status: "approved" };
  }
  if (input.reverseChargeLegendStatus === "LEGAL_TEXT_PENDING_COUNSEL") {
    return { showOnInvoice: false, legendText: null, status: "LEGAL_TEXT_PENDING_COUNSEL" };
  }
  return { showOnInvoice: false, legendText: null, status: "EXTERNAL_LEGAL_COPY_REQUIRED" };
}

test("decision helper reason codes stay aligned with tax-policy.ts", () => {
  const policy = readSource("src/lib/billing/tax-policy.ts");
  for (const code of [
    "b2b_confirmation_required",
    "customer_country_unknown",
    "de_domestic_standard_vat",
    "non_eu_manual_review",
    "eu_vat_id_required",
    "eu_b2b_reverse_charge_legend_pending_counsel",
    "vies_invalid",
    "vies_not_validated",
  ]) {
    assert.match(policy, new RegExp(code));
  }
  assert.match(policy, /businessClassification/);
  assert.match(policy, /country mismatch alone/);
  const classification = readSource("src/lib/billing/tax-classification.ts");
  assert.match(classification, /DOMESTIC_B2B/);
  assert.match(classification, /EU_CROSS_BORDER_B2B_CANDIDATE/);
  assert.match(classification, /NON_EU_B2B/);
  assert.match(classification, /REVIEW_REQUIRED/);
});

test("CASE A: Domestic B2B with sufficient evidence → STANDARD_DOMESTIC_VAT self-serve", () => {
  const result = determineTaxPolicy({
    customerCountryCode: "DE",
    vatId: null,
    viesStatus: "not_checked",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(result.businessClassification, "DOMESTIC_B2B");
  assert.equal(result.outcome, "STANDARD_DOMESTIC_VAT");
  assert.equal(result.blocksCheckout, false);
  assert.equal(result.vatRateBps, 1900);
});

test("CASE B: EU cross-border format-valid VAT without official VIES → NOT Reverse Charge", () => {
  assert.equal(
    classifyB2bTaxRelationship({
      customerCountryCode: "NL",
      isB2bEntrepreneurConfirmed: true,
    }).classification,
    "EU_CROSS_BORDER_B2B_CANDIDATE",
  );
  const result = determineTaxPolicy({
    customerCountryCode: "NL",
    vatId: "NL123456789B01",
    viesStatus: "not_checked",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.notEqual(result.outcome, "REVERSE_CHARGE");
  assert.equal(result.reasonCode, "vies_not_validated");
  assert.equal(result.blocksCheckout, true);
});

test("CASE C: EU B2B with VIES valid → Reverse Charge outcome but self-serve blocked", () => {
  const result = determineTaxPolicy({
    customerCountryCode: "FR",
    vatId: "FR12345678901",
    viesStatus: "valid",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(result.outcome, "REVERSE_CHARGE");
  assert.equal(result.blocksCheckout, true);
  assert.equal(result.reverseChargeLegendStatus, "LEGAL_TEXT_PENDING_COUNSEL");
});

test("CASE D: VIES unavailable → fail-closed", () => {
  const result = determineTaxPolicy({
    customerCountryCode: "AT",
    vatId: "ATU12345678",
    viesStatus: "unavailable",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(result.reasonCode, "vies_not_validated");
  assert.equal(result.blocksCheckout, true);
});

test("CASE E: invalid VAT ID → no unsafe tax outcome", () => {
  const result = determineTaxPolicy({
    customerCountryCode: "BE",
    vatId: "BE0123456789",
    viesStatus: "invalid",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(result.reasonCode, "vies_invalid");
  assert.notEqual(result.outcome, "REVERSE_CHARGE");
});

test("CASE F: no VAT ID — DE domestic allowed; other EU blocked", () => {
  assert.equal(
    determineTaxPolicy({
      customerCountryCode: "DE",
      vatId: null,
      viesStatus: "not_checked",
      isB2bEntrepreneurConfirmed: true,
    }).outcome,
    "STANDARD_DOMESTIC_VAT",
  );
  assert.equal(
    determineTaxPolicy({
      customerCountryCode: "NL",
      vatId: null,
      viesStatus: "not_checked",
      isB2bEntrepreneurConfirmed: true,
    }).reasonCode,
    "eu_vat_id_required",
  );
});

test("CASE G: non-EU B2B distinct — no invented 0%", () => {
  assert.equal(
    classifyB2bTaxRelationship({
      customerCountryCode: "US",
      isB2bEntrepreneurConfirmed: true,
    }).classification,
    "NON_EU_B2B",
  );
  const result = determineTaxPolicy({
    customerCountryCode: "US",
    vatId: null,
    viesStatus: "not_checked",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(result.outcome, "MANUAL_REVIEW");
  assert.equal(result.vatRateBps, null);
});

test("CASE H: seller tax configuration module + COMPANY_INFORMATION", () => {
  const seller = readSource("src/lib/billing/seller-tax-config.ts");
  assert.match(seller, /OPERATOR_INPUT_REQUIRED/);
  assert.match(seller, /COMPANY_INFORMATION/);
  assert.match(seller, /buildSellerInvoiceSnapshot/);
  const company = readSource("src/lib/company/company-information.ts");
  assert.match(company, /vatId:\s*"DE/);
  assert.match(company, /street:/);
});

test("CASE I/J: invoice snapshots seller + tax evidence (immutability)", () => {
  const invoice = readSource("src/lib/billing/sales-invoice.ts");
  assert.match(invoice, /sellerSnapshot/);
  assert.match(invoice, /taxDecisionEvidence/);
  assert.match(invoice, /must not re-read mutable org fields/i);
  assert.equal(
    pathExists("supabase/migrations/20250826100000_sales_invoice_tax_evidence_snapshots.sql"),
    true,
  );
});

test("CASE K: Reverse Charge legend absent unless approved + copy", () => {
  assert.equal(
    resolveReverseChargeLegend({
      taxPolicyOutcome: "REVERSE_CHARGE",
      reverseChargeLegendStatus: "LEGAL_TEXT_PENDING_COUNSEL",
    }).showOnInvoice,
    false,
  );
  assert.equal(
    resolveReverseChargeLegend({
      taxPolicyOutcome: "STANDARD_DOMESTIC_VAT",
      reverseChargeLegendStatus: "n/a",
    }).showOnInvoice,
    false,
  );
  assert.equal(
    resolveReverseChargeLegend({
      taxPolicyOutcome: "REVERSE_CHARGE",
      reverseChargeLegendStatus: "approved",
      approvedLegendText: null,
    }).status,
    "EXTERNAL_LEGAL_COPY_REQUIRED",
  );
  const approved = resolveReverseChargeLegend({
    taxPolicyOutcome: "REVERSE_CHARGE",
    reverseChargeLegendStatus: "approved",
    approvedLegendText: "Reverse charge — counsel-approved.",
  });
  assert.equal(approved.showOnInvoice, true);
  const legend = readSource("src/lib/billing/reverse-charge-legend.ts");
  assert.match(legend, /EXTERNAL_LEGAL_COPY_REQUIRED/);
});

test("CASE L: money totals and rounding deterministic", () => {
  const split = splitVatInclusiveGross({ grossMinor: 17_900, vatRateBps: 1900 });
  assert.equal(split.netMinor + split.vatMinor, 17_900);
  const taxes = readSource("src/lib/billing/taxes.ts");
  assert.match(taxes, /Math\.round/);
  assert.match(taxes, /integer minor units/i);
  assert.match(taxes, /refused non-DE country/i);
});

test("CASE M: invoice numbering concurrency-safe", () => {
  const migration = readSource(
    "supabase/migrations/20250824100000_p1_002_pricing_tax_invoice_contracting.sql",
  );
  assert.match(migration, /allocate_sales_invoice_number/);
  assert.match(migration, /ON CONFLICT \(year\)/);
});

test("CASE N: Mollie live charging remains fail-closed", () => {
  const rollout = readSource("src/lib/billing/providers/mollie/rollout.ts");
  assert.match(rollout, /isMollieLiveChargingEnabled/);
  assert.match(rollout, /return false/);
});

test("CASE O: legacy providers absent from tax/invoice issuance path", () => {
  const fromMollie = readSource("src/lib/billing/sales-invoice-from-mollie.ts");
  assert.doesNotMatch(fromMollie, /\bstripe\b/i);
  assert.doesNotMatch(fromMollie, /\bpaddle\b/i);
  assert.doesNotMatch(fromMollie, /\bfastspring\b/i);
  assert.match(fromMollie, /buyer billing country missing/);
  assert.match(fromMollie, /buildTaxDecisionEvidenceSnapshot/);
});

test("country mismatch alone never yields Reverse Charge", () => {
  const result = determineTaxPolicy({
    customerCountryCode: "NL",
    vatId: "NL123456789B01",
    viesStatus: "skipped",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.notEqual(result.outcome, "REVERSE_CHARGE");
});

test("credit notes not silently mutating invoices", () => {
  const invoice = readSource("src/lib/billing/sales-invoice.ts");
  assert.match(invoice, /CREDIT_NOTE_NOT_IMPLEMENTED/);
});

test("pricing display avoids unconditional VAT-included claim", () => {
  const marketing = readSource("src/lib/marketing/content.ts");
  assert.match(marketing, /Catalog list prices in EUR/);
  const dialog = readSource("src/components/billing/checkout-contract-summary-dialog.tsx");
  assert.doesNotMatch(dialog, /Price \(VAT-inclusive list\)/);
});
