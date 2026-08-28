/**
 * C3 — EU B2B reverse-charge legend unblock (implementation-approved wording).
 *
 * Coverage:
 * - DE domestic unchanged (19% / German VAT / no RC legend)
 * - FR + NL valid VIES → RC treatment, approved legend, buyer VAT ID, no German VAT
 * - Invalid / missing VAT fail-closed
 * - Shared production renderer; preview zero-write
 * - No EXTERNAL_COUNSEL_SIGNOFF / COUNSEL_SIGNED_OFF claim
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/eu-b2b-reverse-charge-legend-c3.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const tax = await import("../src/lib/billing/tax-policy.ts");
const taxes = await import("../src/lib/billing/taxes.ts");
const legendMod = await import("../src/lib/billing/reverse-charge-legend.ts");
const preview = await import("../src/lib/billing/sales-invoice-preview.ts");
const render = await import("../src/lib/billing/sales-invoice-render.ts");
const rollout = await import("../src/lib/billing/providers/mollie/rollout.ts");

const {
  determineTaxPolicy,
  IMPLEMENTATION_TEXT_APPROVED_FOR_C3,
  LEGAL_TEXT_PENDING_COUNSEL,
} = tax;
const { calculateVatInclusiveBreakdown } = taxes;
const {
  resolveReverseChargeLegend,
  REVERSE_CHARGE_LEGEND_EN,
  REVERSE_CHARGE_LEGEND_DE,
} = legendMod;
const { buildPreviewSalesInvoice } = preview;
const { renderSalesInvoiceHtml, generateSalesInvoicePdf } = render;
const { isMollieLiveChargingEnabled } = rollout;

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

test("TEST 1 — DE domestic: 19% VAT, German VAT note, no RC legend", async () => {
  const determination = determineTaxPolicy({
    customerCountryCode: "DE",
    vatId: "DE123456789",
    viesStatus: "not_checked",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(determination.outcome, "STANDARD_DOMESTIC_VAT");
  assert.equal(determination.blocksCheckout, false);
  assert.equal(determination.vatRateBps, 1900);
  assert.equal(determination.reverseChargeLegendStatus, "n/a");

  const { invoice } = buildPreviewSalesInvoice("business", "de");
  assert.equal(invoice.taxPolicyOutcome, "STANDARD_DOMESTIC_VAT");
  assert.equal(invoice.netMinor, 50_336);
  assert.equal(invoice.vatMinor, 9_564);
  assert.equal(invoice.grossMinor, 59_900);
  assert.equal(invoice.taxNote, "German VAT (19%)");
  assert.equal(invoice.reverseChargeApplied, false);

  const html = renderSalesInvoiceHtml(invoice, { preview: true, locale: "en" });
  assert.match(html, /German VAT \(19%\)/);
  assert.doesNotMatch(html, /Reverse charge — VAT to be accounted for by the recipient/);
  assert.match(html, /TEST DOCUMENT/);
});

test("TEST 2 — FR valid EU B2B: RC legend, buyer VAT, no German VAT 19%", async () => {
  const determination = determineTaxPolicy({
    customerCountryCode: "FR",
    vatId: "FR12345678901",
    viesStatus: "valid",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(determination.outcome, "REVERSE_CHARGE");
  assert.equal(determination.blocksCheckout, false);
  assert.equal(determination.reverseChargeLegendStatus, IMPLEMENTATION_TEXT_APPROVED_FOR_C3);

  const breakdown = calculateVatInclusiveBreakdown({
    grossMinor: 59_900,
    determination,
  });
  assert.equal(breakdown.vatMinor, 0);
  assert.equal(breakdown.vatRateBps, 0);
  assert.equal(breakdown.netMinor, 59_900);

  const legend = resolveReverseChargeLegend({
    taxPolicyOutcome: "REVERSE_CHARGE",
    reverseChargeLegendStatus: IMPLEMENTATION_TEXT_APPROVED_FOR_C3,
  });
  assert.equal(legend.showOnInvoice, true);
  assert.equal(legend.legendText, REVERSE_CHARGE_LEGEND_EN);
  assert.match(legend.legendText, /Reverse charge/);

  const { invoice } = buildPreviewSalesInvoice("business", "fr");
  assert.equal(invoice.taxPolicyOutcome, "REVERSE_CHARGE");
  assert.equal(invoice.reverseChargeApplied, true);
  assert.equal(invoice.buyerVatId, "FR12345678901");
  assert.equal(invoice.buyerCountryCode, "FR");
  assert.equal(invoice.vatMinor, 0);
  assert.equal(invoice.taxNote, REVERSE_CHARGE_LEGEND_EN);

  const html = renderSalesInvoiceHtml(invoice, { preview: true, locale: "en" });
  assert.match(html, /Reverse charge — VAT to be accounted for by the recipient/);
  assert.match(html, /FR12345678901/);
  assert.doesNotMatch(html, /German VAT \(19%\)/);
  assert.doesNotMatch(html, /noreply@/);
  assert.doesNotMatch(html, /legal@/);
  assert.doesNotMatch(html, /eur-v1/);
  assert.match(html, /TEST DOCUMENT/);

  const pdf = await generateSalesInvoicePdf(invoice, {
    preview: true,
    locale: "en",
    compress: false,
  });
  const text = extractPdfText(pdf);
  assert.match(text, /Reverse charge/);
  assert.doesNotMatch(text, /German VAT \(19%\)/);
});

test("TEST 3 — NL valid EU B2B: same RC invariants", async () => {
  const determination = determineTaxPolicy({
    customerCountryCode: "NL",
    vatId: "NL123456789B01",
    viesStatus: "valid",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(determination.outcome, "REVERSE_CHARGE");
  assert.equal(determination.blocksCheckout, false);

  const { invoice } = buildPreviewSalesInvoice("business", "nl");
  assert.equal(invoice.taxPolicyOutcome, "REVERSE_CHARGE");
  assert.equal(invoice.buyerVatId, "NL123456789B01");
  assert.equal(invoice.taxNote, REVERSE_CHARGE_LEGEND_EN);

  const html = renderSalesInvoiceHtml(invoice, { preview: true, locale: "en" });
  assert.match(html, /Reverse charge — VAT to be accounted for by the recipient/);
  assert.match(html, /NL123456789B01/);
  assert.doesNotMatch(html, /German VAT \(19%\)/);
});

test("TEST 4 — invalid VAT fail-closed", () => {
  const result = determineTaxPolicy({
    customerCountryCode: "FR",
    vatId: "FR00000000000",
    viesStatus: "invalid",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.notEqual(result.outcome, "REVERSE_CHARGE");
  assert.equal(result.blocksCheckout, true);
  assert.equal(result.reasonCode, "vies_invalid");
  const legend = resolveReverseChargeLegend({
    taxPolicyOutcome: "REVERSE_CHARGE",
    reverseChargeLegendStatus: LEGAL_TEXT_PENDING_COUNSEL,
  });
  assert.equal(legend.showOnInvoice, false);
});

test("TEST 5 — missing VAT fail-closed", () => {
  const result = determineTaxPolicy({
    customerCountryCode: "NL",
    vatId: null,
    viesStatus: "not_checked",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(result.reasonCode, "eu_vat_id_required");
  assert.equal(result.blocksCheckout, true);
  assert.notEqual(result.outcome, "REVERSE_CHARGE");
});

test("TEST 6 — shared production renderer for download + email", () => {
  const downloadRoute = readSource("src/app/api/billing/sales-invoices/[invoiceId]/pdf/route.ts");
  const pdfHelper = readSource("src/lib/billing/sales-invoice-pdf.ts");
  const emailMod = readSource("src/lib/billing/sales-invoice-email.ts");
  const renderMod = readSource("src/lib/billing/sales-invoice-render.ts");
  assert.match(downloadRoute, /generateIssuedSalesInvoicePdfForOrganization/);
  assert.match(pdfHelper, /generateSalesInvoicePdf/);
  assert.match(emailMod, /generateSalesInvoicePdf|generatePdf/);
  assert.match(renderMod, /generateSalesInvoicePdf/);
});

test("TEST 7 — customer content hardened on RC path", async () => {
  const { invoice } = buildPreviewSalesInvoice("business", "fr");
  const html = renderSalesInvoiceHtml(invoice, { preview: false, locale: "en" });
  assert.doesNotMatch(html, /noreply@/);
  assert.doesNotMatch(html, /no-reply@/i);
  assert.doesNotMatch(html, /legal@/);
  assert.doesNotMatch(html, /eur-v1-/);
  assert.doesNotMatch(html, /German VAT \(19%\)/);
  assert.match(html, /Reverse charge/);
  assert.match(html, /support@auroranexis\.com/);
});

test("TEST 8 — preview zero-write + TEST DOCUMENT marker", () => {
  const previewSrc = readSource("src/lib/billing/sales-invoice-preview.ts");
  assert.match(previewSrc, /Never persists|never persists|in-memory/i);
  assert.doesNotMatch(previewSrc, /\.from\(["']sales_invoices["']\)\.insert/);
  assert.doesNotMatch(previewSrc, /allocate_sales_invoice_number/);
  assert.doesNotMatch(previewSrc, /sendSalesInvoiceIssuedEmail|sendEmail/);

  const route = readSource("src/app/api/operator/sales-invoice/preview/route.ts");
  assert.match(route, /scenario/);
  assert.match(route, /preview:\s*true/);
  assert.doesNotMatch(route, /\.insert\(/);

  const { invoice } = buildPreviewSalesInvoice("business", "fr");
  const html = renderSalesInvoiceHtml(invoice, { preview: true, locale: "en" });
  assert.match(html, /TEST DOCUMENT/);
});

test("C3: German locale uses approved DE legend without new i18n framework", () => {
  assert.match(REVERSE_CHARGE_LEGEND_DE, /Reverse Charge/);
  assert.match(REVERSE_CHARGE_LEGEND_DE, /Steuerschuldnerschaft/);
  const legend = resolveReverseChargeLegend({
    taxPolicyOutcome: "REVERSE_CHARGE",
    reverseChargeLegendStatus: IMPLEMENTATION_TEXT_APPROVED_FOR_C3,
    locale: "de",
  });
  assert.equal(legend.legendText, REVERSE_CHARGE_LEGEND_DE);

  const { invoice } = buildPreviewSalesInvoice("business", "fr");
  const htmlDe = renderSalesInvoiceHtml(invoice, { preview: true, locale: "de" });
  assert.match(htmlDe, /Steuerschuldnerschaft des Leistungsempfängers \(Reverse Charge\)/);
});

test("C3: no external counsel sign-off claimed; LIVE remains false; P1-002 OPEN", () => {
  const policy = readSource("src/lib/billing/tax-policy.ts");
  const legend = readSource("src/lib/billing/reverse-charge-legend.ts");
  assert.match(policy, /IMPLEMENTATION_TEXT_APPROVED_FOR_C3/);
  assert.match(policy, /Not external tax\/legal counsel sign-off/i);
  assert.doesNotMatch(policy, /COUNSEL_SIGNED_OFF\s*=\s*true/);
  assert.doesNotMatch(legend, /COUNSEL_SIGNED_OFF\s*=\s*true/);
  assert.doesNotMatch(legend, /EXTERNAL_COUNSEL_SIGNOFF\s*=\s*true/);
  assert.equal(isMollieLiveChargingEnabled(), false);

  const closeout = readSource("docs/final-production-closeout.md");
  assert.match(closeout, /P1-002.*OPEN/i);
});

test("C3: B2C paths fail closed; NON_EU verified unblocked by C3.2", () => {
  const nonEu = determineTaxPolicy({
    customerCountryCode: "US",
    vatId: null,
    viesStatus: "not_checked",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(nonEu.outcome, "NON_EU_B2B_PLACE_OF_SUPPLY");
  assert.equal(nonEu.blocksCheckout, false);

  const b2c = determineTaxPolicy({
    customerCountryCode: "DE",
    vatId: null,
    viesStatus: "not_checked",
    isB2bEntrepreneurConfirmed: false,
  });
  assert.equal(b2c.outcome, "UNKNOWN_BLOCK_CHECKOUT");
  assert.equal(b2c.reasonCode, "b2b_confirmation_required");
});

test("C3: VIES still required — format-valid alone is not Reverse Charge", () => {
  const result = determineTaxPolicy({
    customerCountryCode: "FR",
    vatId: "FR12345678901",
    viesStatus: "not_checked",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.notEqual(result.outcome, "REVERSE_CHARGE");
  assert.equal(result.reasonCode, "vies_not_validated");
  assert.equal(result.blocksCheckout, true);
});
