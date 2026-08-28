/**
 * C3.2 — NON_EU_B2B place-of-supply tax treatment (engineering-approved legend).
 *
 * Coverage:
 * - Global ANX-YYYY-###### numbering unchanged; preview TEST-* only
 * - DE + EU RC regression
 * - Verified NON_EU B2B: US/CH/GB/JP/KR/CA/AU
 * - Unverified fail-closed
 * - Exact C3.2 legend; German VAT label (not VAT 0% for NON_EU)
 * - No VIES for non-EU; LIVE remains false; P1-002 OPEN
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/non-eu-b2b-tax-c3-2.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const tax = await import("../src/lib/billing/tax-policy.ts");
const taxes = await import("../src/lib/billing/taxes.ts");
const legendMod = await import("../src/lib/billing/non-eu-b2b-legend.ts");
const rcLegendMod = await import("../src/lib/billing/reverse-charge-legend.ts");
const preview = await import("../src/lib/billing/sales-invoice-preview.ts");
const render = await import("../src/lib/billing/sales-invoice-render.ts");
const emailMod = await import("../src/lib/billing/sales-invoice-email.ts");
const rollout = await import("../src/lib/billing/providers/mollie/rollout.ts");
const countryMod = await import("../src/lib/i18n/country.ts");

const {
  determineTaxPolicy,
  IMPLEMENTATION_TEXT_APPROVED_FOR_C3,
  IMPLEMENTATION_TEXT_APPROVED_FOR_C3_2,
  taxOutcomeAllowsSelfServeCheckout,
} = tax;
const { calculateVatInclusiveBreakdown } = taxes;
const { resolveNonEuB2bLegend, NON_EU_B2B_LEGEND_EN } = legendMod;
const { REVERSE_CHARGE_LEGEND_EN } = rcLegendMod;
const { buildPreviewSalesInvoice } = preview;
const { renderSalesInvoiceHtml, generateSalesInvoicePdf } = render;
const { isMollieLiveChargingEnabled } = rollout;
const { formatInvoiceCountryName } = countryMod;

const NON_EU_COUNTRIES = ["US", "CH", "GB", "JP", "KR", "CA", "AU"];
const NON_EU_SCENARIOS = ["us", "ch", "gb", "jp", "kr", "ca", "au"];
const EXPECTED_COUNTRY_NAMES = {
  US: "United States",
  CH: "Switzerland",
  GB: "United Kingdom",
  JP: "Japan",
  KR: "South Korea",
  CA: "Canada",
  AU: "Australia",
};

function extractPdfText(pdfBuffer) {
  const raw = Buffer.from(pdfBuffer).toString("latin1");
  const parts = [];
  for (const match of raw.matchAll(/<([0-9A-Fa-f]+)>/g)) {
    const hex = match[1];
    if (hex.length >= 2 && hex.length % 2 === 0) {
      parts.push(Buffer.from(hex, "hex").toString("latin1"));
    }
  }
  for (const match of raw.matchAll(/\((?:\\.|[^\\)])*\)/g)) {
    parts.push(match[0].slice(1, -1).replace(/\\(.)/g, "$1"));
  }
  return parts.join("");
}

test("C3.2 NUMBERING — production pattern global; preview TEST never ANX production", () => {
  const allocator = readSource(
    "supabase/migrations/20250824100000_p1_002_pricing_tax_invoice_contracting.sql",
  );
  assert.match(allocator, /'ANX-' \|\|/);
  assert.match(allocator, /lpad/i);
  assert.doesNotMatch(allocator, /p_country/i);

  for (const scenario of NON_EU_SCENARIOS) {
    const { invoice } = buildPreviewSalesInvoice("business", scenario);
    assert.match(invoice.invoiceNumber, /^TEST-ANX-2026-/);
    assert.doesNotMatch(invoice.invoiceNumber, /^ANX-\d{4}-\d{6}$/);
    assert.doesNotMatch(invoice.invoiceNumber, /^ANX-2026-(US|CH|GB|JP|KR|CA|AU)-/);
  }

  const previewSrc = readSource("src/lib/billing/sales-invoice-preview.ts");
  assert.doesNotMatch(previewSrc, /allocate_sales_invoice_number/);
  assert.doesNotMatch(previewSrc, /issueSalesInvoice/);
  assert.doesNotMatch(previewSrc, /createAdminClient/);
});

test("C3.2 DE regression — 19% / 503.36+95.64=599 / German VAT note", () => {
  const determination = determineTaxPolicy({
    customerCountryCode: "DE",
    vatId: "DE123456789",
    viesStatus: "not_checked",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(determination.outcome, "STANDARD_DOMESTIC_VAT");
  assert.equal(determination.vatRateBps, 1900);

  const { invoice } = buildPreviewSalesInvoice("business", "de");
  assert.equal(invoice.netMinor, 50_336);
  assert.equal(invoice.vatMinor, 9_564);
  assert.equal(invoice.grossMinor, 59_900);
  assert.equal(invoice.taxNote, "German VAT (19%)");
  assert.equal(invoice.reverseChargeApplied, false);

  const html = renderSalesInvoiceHtml(invoice, { preview: true, locale: "en" });
  assert.match(html, /VAT \(19%\)|German VAT \(19%\)/);
  assert.doesNotMatch(html, /place of supply outside Germany/);
  assert.doesNotMatch(html, /Reverse charge — VAT to be accounted for by the recipient/);
});

test("C3.2 EU RC regression — FR/NL unchanged", () => {
  for (const scenario of ["fr", "nl"]) {
    const { invoice } = buildPreviewSalesInvoice("business", scenario);
    assert.equal(invoice.taxPolicyOutcome, "REVERSE_CHARGE");
    assert.equal(invoice.reverseChargeApplied, true);
    assert.equal(invoice.netMinor, 59_900);
    assert.equal(invoice.vatMinor, 0);
    assert.equal(invoice.grossMinor, 59_900);
    assert.equal(invoice.taxNote, REVERSE_CHARGE_LEGEND_EN);

    const html = renderSalesInvoiceHtml(invoice, { preview: true, locale: "en" });
    assert.match(html, /Reverse charge — VAT to be accounted for by the recipient/);
    assert.doesNotMatch(html, /place of supply outside Germany/);
    assert.match(html, /VAT \(0%\)/);
  }

  const fr = determineTaxPolicy({
    customerCountryCode: "FR",
    vatId: "FR12345678901",
    viesStatus: "valid",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(fr.reverseChargeLegendStatus, IMPLEMENTATION_TEXT_APPROVED_FOR_C3);
});

test("C3.2 NON-EU verified B2B — US/CH/GB/JP/KR/CA/AU", async () => {
  for (const code of NON_EU_COUNTRIES) {
    const determination = determineTaxPolicy({
      customerCountryCode: code,
      vatId: null,
      viesStatus: "skipped",
      isB2bEntrepreneurConfirmed: true,
    });
    assert.equal(determination.outcome, "NON_EU_B2B_PLACE_OF_SUPPLY");
    assert.equal(determination.businessClassification, "NON_EU_B2B");
    assert.equal(determination.blocksCheckout, false);
    assert.equal(determination.vatRateBps, 0);
    assert.equal(determination.reasonCode, "non_eu_b2b_place_of_supply");
    assert.equal(
      determination.reverseChargeLegendStatus,
      IMPLEMENTATION_TEXT_APPROVED_FOR_C3_2,
    );
    assert.equal(taxOutcomeAllowsSelfServeCheckout(determination.outcome), true);

    const breakdown = calculateVatInclusiveBreakdown({
      grossMinor: 59_900,
      determination,
    });
    assert.equal(breakdown.netMinor, 59_900);
    assert.equal(breakdown.vatMinor, 0);
    assert.equal(breakdown.grossMinor, 59_900);
    assert.equal(breakdown.outcome, "NON_EU_B2B_PLACE_OF_SUPPLY");

    assert.equal(formatInvoiceCountryName(code, "en"), EXPECTED_COUNTRY_NAMES[code]);
  }

  for (const scenario of NON_EU_SCENARIOS) {
    const { invoice } = buildPreviewSalesInvoice("business", scenario);
    assert.equal(invoice.taxPolicyOutcome, "NON_EU_B2B_PLACE_OF_SUPPLY");
    assert.equal(invoice.businessClassification, "NON_EU_B2B");
    assert.equal(invoice.reverseChargeApplied, false);
    assert.equal(invoice.netMinor, 59_900);
    assert.equal(invoice.vatMinor, 0);
    assert.equal(invoice.grossMinor, 59_900);
    assert.equal(invoice.taxNote, NON_EU_B2B_LEGEND_EN);
    assert.equal(
      invoice.taxDecisionEvidence?.reverseChargeLegendStatus,
      IMPLEMENTATION_TEXT_APPROVED_FOR_C3_2,
    );

    const html = renderSalesInvoiceHtml(invoice, { preview: true, locale: "en" });
    assert.match(html, /TEST DOCUMENT/);
    assert.match(html, /German VAT/);
    assert.doesNotMatch(html, /VAT \(0%\)/);
    assert.match(
      html,
      /Service not subject to German VAT — place of supply outside Germany pursuant to § 3a\(2\) German VAT Act \(UStG\)\./,
    );
    assert.doesNotMatch(html, /Reverse charge — VAT to be accounted for by the recipient/);
    assert.doesNotMatch(html, /NON_EU_B2B/);
    assert.doesNotMatch(html, /NON_EU_B2B_PLACE_OF_SUPPLY/);
    assert.doesNotMatch(html, /MANUAL_REVIEW/);
    assert.doesNotMatch(html, /eur-v1/i);
    assert.doesNotMatch(html, /noreply@/);
    assert.doesNotMatch(html, /legal@/);
    assert.doesNotMatch(html, /Mollie/);
    assert.doesNotMatch(html, /invoice-test-/);

    const countryName = EXPECTED_COUNTRY_NAMES[invoice.buyerCountryCode];
    assert.match(html, new RegExp(countryName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

    const pdf = await generateSalesInvoicePdf(invoice, {
      preview: true,
      locale: "en",
      compress: false,
    });
    const pdfText = extractPdfText(pdf);
    assert.match(pdfText, /German VAT/);
    assert.match(pdfText, /place of supply outside Germany/);
  }

  const legend = resolveNonEuB2bLegend({
    taxPolicyOutcome: "NON_EU_B2B_PLACE_OF_SUPPLY",
    reverseChargeLegendStatus: IMPLEMENTATION_TEXT_APPROVED_FOR_C3_2,
  });
  assert.equal(legend.showOnInvoice, true);
  assert.equal(legend.legendText, NON_EU_B2B_LEGEND_EN);
});

test("C3.2 NON-EU unverified fail closed", () => {
  for (const code of NON_EU_COUNTRIES) {
    const result = determineTaxPolicy({
      customerCountryCode: code,
      vatId: null,
      viesStatus: "not_checked",
      isB2bEntrepreneurConfirmed: false,
    });
    assert.equal(result.outcome, "UNKNOWN_BLOCK_CHECKOUT");
    assert.equal(result.blocksCheckout, true);
    assert.equal(result.businessClassification, "REVIEW_REQUIRED");
    assert.notEqual(result.outcome, "NON_EU_B2B_PLACE_OF_SUPPLY");
    assert.notEqual(result.outcome, "REVERSE_CHARGE");
    assert.notEqual(result.outcome, "STANDARD_DOMESTIC_VAT");
    assert.throws(() =>
      calculateVatInclusiveBreakdown({ grossMinor: 59_900, determination: result }),
    );
  }
});

test("C3.2 no VIES for NON_EU; schema distinguishes from EU RC", () => {
  const policy = readSource("src/lib/billing/tax-policy.ts");
  assert.match(policy, /non_eu_b2b_place_of_supply/);
  assert.match(policy, /NON_EU_B2B_PLACE_OF_SUPPLY/);
  assert.match(policy, /IMPLEMENTATION_TEXT_APPROVED_FOR_C3_2/);
  assert.match(policy, /§ 3a Abs\. 2 UStG|3a Abs\. 2/);

  const { invoice: us } = buildPreviewSalesInvoice("business", "us");
  const { invoice: fr } = buildPreviewSalesInvoice("business", "fr");
  assert.equal(us.businessClassification, "NON_EU_B2B");
  assert.equal(us.reverseChargeApplied, false);
  assert.equal(us.taxPolicyOutcome, "NON_EU_B2B_PLACE_OF_SUPPLY");
  assert.equal(fr.businessClassification, "EU_CROSS_BORDER_B2B_CANDIDATE");
  assert.equal(fr.reverseChargeApplied, true);
  assert.equal(fr.taxPolicyOutcome, "REVERSE_CHARGE");
  assert.notEqual(us.taxNote, fr.taxNote);

  const fromMollie = readSource("src/lib/billing/sales-invoice-from-mollie.ts");
  assert.match(fromMollie, /mayIssueNonEuB2b|NON_EU_B2B_PLACE_OF_SUPPLY/);
  assert.match(fromMollie, /IMPLEMENTATION_TEXT_APPROVED_FOR_C3_2/);
});

test("C3.2 C2 email / contacts / LIVE / P1-002 preserved", () => {
  const emailSrc = readSource("src/lib/billing/sales-invoice-email.ts");
  assert.match(emailSrc, /buildSalesInvoiceIssuedTemplateKey/);
  assert.match(emailSrc, /idempotent_skip/);
  assert.match(emailSrc, /COMPANY_CONTACT\.supportEmail/);
  assert.match(emailSrc, /generateSalesInvoicePdf/);
  const template = readSource("src/lib/email/templates/sales-invoice.ts");
  assert.match(template, /sales_invoice:\$\{/);
  assert.doesNotMatch(template, /noreply@auroranexis\.com/);
  assert.doesNotMatch(template, /legal@auroranexis\.com/);

  assert.equal(isMollieLiveChargingEnabled(), false);
  const closeout = readSource("docs/final-production-closeout.md");
  assert.match(closeout, /P1-002.*OPEN/i);

  const legend = readSource("src/lib/billing/non-eu-b2b-legend.ts");
  assert.match(legend, /IMPLEMENTATION_TEXT_APPROVED_FOR_C3_2/);
  assert.doesNotMatch(legend, /COUNSEL_SIGNED_OFF\s*=\s*true/);
  assert.doesNotMatch(legend, /EXTERNAL_COUNSEL_SIGNOFF\s*=\s*true/);
});
