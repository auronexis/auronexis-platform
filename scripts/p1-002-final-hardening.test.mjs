/**
 * P1-002 final hardening — targeted regression (DPA / RC / NON-EU evidence / docs).
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/p1-002-final-hardening.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource, pathExists } from "./_test-helpers/read-source.mjs";

const tax = await import("../src/lib/billing/tax-policy.ts");
const legendMod = await import("../src/lib/billing/reverse-charge-legend.ts");
const evidenceMod = await import("../src/lib/billing/tax-decision-evidence.ts");
const contracting = await import("../src/lib/billing/contracting.ts");
const preview = await import("../src/lib/billing/sales-invoice-preview.ts");
const render = await import("../src/lib/billing/sales-invoice-render.ts");
const rollout = await import("../src/lib/billing/providers/mollie/rollout.ts");
const dpaDoc = await import("../src/lib/company/dpa-document.ts");
const companyInfo = await import("../src/lib/company/company-information.ts");

const { determineTaxPolicy, IMPLEMENTATION_TEXT_APPROVED_FOR_C3 } = tax;
const { REVERSE_CHARGE_LEGEND, resolveReverseChargeLegend } = legendMod;
const { resolveBusinessEvidenceMethod, buildTaxDecisionEvidenceSnapshot } = evidenceMod;
const {
  DPA_DOCUMENT_VERSION,
  buildDpaAcceptanceEvidence,
  TERMS_DOCUMENT_VERSION,
} = contracting;
const { buildPreviewSalesInvoice } = preview;
const { renderSalesInvoiceHtml } = render;
const { isMollieLiveChargingEnabled } = rollout;
const { buildDpaPageSections, DPA_EXTERNAL_REVIEW_STATUS } = dpaDoc;
const { COMPANY_INFORMATION } = companyInfo;

test("EU RC invoice preview: seller VAT, buyer VAT, bilingual legend", () => {
  const { invoice } = buildPreviewSalesInvoice("business", "fr");
  assert.equal(invoice.taxPolicyOutcome, "REVERSE_CHARGE");
  assert.equal(invoice.vatMinor, 0);
  assert.ok(invoice.buyerVatId?.startsWith("FR"));
  assert.equal(invoice.sellerSnapshot?.vatId, COMPANY_INFORMATION.vatId);
  assert.equal(invoice.taxNote, REVERSE_CHARGE_LEGEND);
  assert.match(
    REVERSE_CHARGE_LEGEND,
    /^Steuerschuldnerschaft des Leistungsempfängers \/ Reverse charge — VAT to be accounted for by the recipient\.$/,
  );

  const html = renderSalesInvoiceHtml(invoice, { preview: true, locale: "en" });
  assert.match(html, /Steuerschuldnerschaft des Leistungsempfängers/);
  assert.match(html, /Reverse charge — VAT to be accounted for by the recipient/);
  assert.match(html, new RegExp(COMPANY_INFORMATION.vatId));
  assert.match(html, /FR12345678901/);
  assert.doesNotMatch(html, /German VAT \(19%\)/);
  assert.doesNotMatch(html, /§ 3a\(2\)/);
});

test("EU unverified / invalid VAT fail-closed", () => {
  for (const viesStatus of ["not_checked", "unavailable", "skipped", "invalid"]) {
    const result = determineTaxPolicy({
      customerCountryCode: "FR",
      vatId: "FR12345678901",
      viesStatus,
      isB2bEntrepreneurConfirmed: true,
    });
    assert.equal(result.outcome, "UNKNOWN_BLOCK_CHECKOUT");
    assert.equal(result.blocksCheckout, true);
  }
  const missing = determineTaxPolicy({
    customerCountryCode: "NL",
    vatId: null,
    viesStatus: "not_checked",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(missing.reasonCode, "eu_vat_id_required");
});

test("NON-EU country alone fails closed; confirmed B2B succeeds with self-attestation", () => {
  for (const country of ["US", "CH", "GB", "JP"]) {
    const blocked = determineTaxPolicy({
      customerCountryCode: country,
      vatId: null,
      viesStatus: "not_checked",
      isB2bEntrepreneurConfirmed: false,
    });
    assert.equal(blocked.outcome, "UNKNOWN_BLOCK_CHECKOUT");
    assert.equal(blocked.reasonCode, "b2b_confirmation_required");

    const allowed = determineTaxPolicy({
      customerCountryCode: country,
      vatId: null,
      viesStatus: "skipped",
      isB2bEntrepreneurConfirmed: true,
    });
    assert.equal(allowed.outcome, "NON_EU_B2B_PLACE_OF_SUPPLY");
    assert.equal(
      resolveBusinessEvidenceMethod({
        taxPolicyOutcome: allowed.outcome,
        viesStatus: "skipped",
        isB2bEntrepreneurConfirmed: true,
      }),
      "SELF_ATTESTED_B2B",
    );
  }

  const { invoice } = buildPreviewSalesInvoice("business", "us");
  assert.equal(invoice.taxPolicyOutcome, "NON_EU_B2B_PLACE_OF_SUPPLY");
  assert.equal(invoice.taxDecisionEvidence?.businessEvidenceMethod, "SELF_ATTESTED_B2B");
  assert.equal(invoice.taxDecisionEvidence?.b2bEntrepreneurConfirmed, true);
  assert.ok(invoice.taxDecisionEvidence?.decidedAt);
  assert.doesNotMatch(invoice.taxNote ?? "", /Reverse charge/);
});

test("VIES-verified EU RC evidence method is VIES_VERIFIED not self-attested", () => {
  assert.equal(
    resolveBusinessEvidenceMethod({
      taxPolicyOutcome: "REVERSE_CHARGE",
      viesStatus: "valid",
      isB2bEntrepreneurConfirmed: true,
    }),
    "VIES_VERIFIED",
  );
  const { invoice } = buildPreviewSalesInvoice("business", "nl");
  assert.equal(invoice.taxDecisionEvidence?.businessEvidenceMethod, "VIES_VERIFIED");
});

test("DPA version acceptance persists historically; public DPA has annexes", () => {
  assert.equal(DPA_DOCUMENT_VERSION, "dpa-2026-08-29-v1");
  assert.equal(DPA_EXTERNAL_REVIEW_STATUS, "READY_FOR_EXTERNAL_LEGAL_REVIEW");
  const accepted = buildDpaAcceptanceEvidence({ source: "checkout", acceptedAt: "2026-08-29T12:00:00.000Z" });
  assert.equal(accepted.documentVersion, "dpa-2026-08-29-v1");
  assert.equal(accepted.kind, "dpa");

  // Historical evidence keeps recorded version even if constant were conceptually bumped later.
  const historicalVersion = accepted.documentVersion;
  assert.equal(historicalVersion, "dpa-2026-08-29-v1");
  assert.notEqual(historicalVersion, TERMS_DOCUMENT_VERSION);

  const sections = buildDpaPageSections();
  const headings = sections.map((s) => s.heading).join("\n");
  assert.match(headings, /ANNEX I/);
  assert.match(headings, /ANNEX II/);
  assert.match(headings, /ANNEX III/);
  assert.match(headings, /ANNEX IV/);
  assert.match(headings, /Technical and organisational measures/);
  assert.doesNotMatch(sections.map((s) => s.body).join("\n"), /READY_FOR_EXTERNAL_LEGAL_REVIEW/);
  assert.doesNotMatch(sections.map((s) => s.body).join("\n"), /LEGAL_TEXT_PENDING_COUNSEL/);
});

test("Checkout cannot bypass required Terms / B2B acceptance (server Zod)", () => {
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /termsAccepted:\s*z\.boolean\(\)\.refine\(\(value\)\s*=>\s*value\s*===\s*true/);
  assert.match(
    actions,
    /b2bEntrepreneurConfirmed:\s*z\.boolean\(\)\.refine\(\(value\)\s*=>\s*value\s*===\s*true/,
  );
  assert.match(actions, /business customers only/);
  assert.match(actions, /addressLine1:\s*requiredTrimmed/);
  assert.match(actions, /buildDpaAcceptanceEvidence/);
  assert.match(actions, /persistContractAcceptance/);
  const dialog = readSource("src/components/billing/checkout-contract-summary-dialog.tsx");
  assert.doesNotMatch(dialog, /defaultChecked/);
  assert.match(dialog, /summary\.dpaVersion/);
  assert.match(dialog, /Billing street address/);
});

test("RC issuance fail-closed without buyer/seller VAT IDs", () => {
  const invoiceSrc = readSource("src/lib/billing/sales-invoice.ts");
  assert.match(invoiceSrc, /Reverse Charge invoice blocked: seller VAT ID missing/);
  assert.match(invoiceSrc, /Reverse Charge invoice blocked: buyer VAT ID missing/);
  assert.match(invoiceSrc, /buyer invoice address incomplete/);
  const fromMollie = readSource("src/lib/billing/sales-invoice-from-mollie.ts");
  assert.match(fromMollie, /Reverse Charge requires seller and buyer VAT IDs/);
  assert.match(fromMollie, /B2B entrepreneur acceptance missing/);
});

test("Operator docs: refund runbook, e-invoice roadmap, subprocessor change", () => {
  assert.equal(pathExists("docs/billing/refund-invoice-correction-runbook.md"), true);
  assert.equal(pathExists("docs/billing/e-invoice-readiness-roadmap.md"), true);
  assert.equal(pathExists("docs/billing/subprocessor-change-procedure.md"), true);
  const refund = readSource("docs/billing/refund-invoice-correction-runbook.md");
  assert.match(refund, /A Mollie refund is not an invoice correction/i);
  assert.match(refund, /AUTOMATED_CREDIT_NOTES = NO/);
  assert.match(refund, /Do not claim/);
  assert.match(refund, /Refund automatically voids the Auroranexis invoice/);
  const einv = readSource("docs/billing/e-invoice-readiness-roadmap.md");
  assert.match(einv, /XRechnung XML[\s\S]*NO/);
  assert.match(einv, /ZUGFeRD[\s\S]*NO/);
  assert.match(einv, /TAX_ADVISER_SIGNOFF_REQUIRED/);
});

test("Legend resolver uses single canonical constant", () => {
  const legend = resolveReverseChargeLegend({
    taxPolicyOutcome: "REVERSE_CHARGE",
    reverseChargeLegendStatus: IMPLEMENTATION_TEXT_APPROVED_FOR_C3,
    locale: "en",
  });
  assert.equal(legend.legendText, REVERSE_CHARGE_LEGEND);
  const legendDe = resolveReverseChargeLegend({
    taxPolicyOutcome: "REVERSE_CHARGE",
    reverseChargeLegendStatus: IMPLEMENTATION_TEXT_APPROVED_FOR_C3,
    locale: "de",
  });
  assert.equal(legendDe.legendText, REVERSE_CHARGE_LEGEND);
});

test("LIVE charging remains false", () => {
  assert.equal(isMollieLiveChargingEnabled(), false);
});

test("Evidence snapshot reconstructs NON_EU decision fields", () => {
  const determination = determineTaxPolicy({
    customerCountryCode: "US",
    vatId: null,
    viesStatus: "skipped",
    isB2bEntrepreneurConfirmed: true,
  });
  const snap = buildTaxDecisionEvidenceSnapshot({
    organizationId: "00000000-0000-4000-8000-000000000001",
    buyerLegalName: "Test Inc",
    buyerCountryCode: "US",
    buyerVatIdNormalized: null,
    vatTechnicalState: "NOT_PROVIDED",
    viesStatus: "skipped",
    viesCheckedAt: null,
    businessClassification: determination.businessClassification,
    determination,
    sellerSnapshot: {
      legalName: COMPANY_INFORMATION.legalName,
      vatId: COMPANY_INFORMATION.vatId,
      countryCode: "DE",
      addressLines: ["x"],
      configStatus: "ready",
    },
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(snap.businessEvidenceMethod, "SELF_ATTESTED_B2B");
  assert.equal(snap.b2bEntrepreneurConfirmed, true);
  assert.equal(snap.taxPolicyOutcome, "NON_EU_B2B_PLACE_OF_SUPPLY");
  assert.ok(snap.decidedAt);
});
