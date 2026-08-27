/**
 * Phase C1.6 — Customer invoice PDF professional redesign + branding remediation.
 *
 * Behavioral coverage (not regex-only):
 * - shared generateSalesInvoicePdf succeeds for production + preview
 * - production uses issued snapshot values (number, seller, buyer, totals)
 * - preview carries TEST DOCUMENT marker; production does not
 * - zero noreply@auroranexis.com in PDF bytes / extracted text
 * - canonical on-light horizontal logo embedded from local public asset
 * - preview path remains zero-write / shared renderer
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/customer-invoice-pdf-redesign-c1-6.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { readSource } from "./_test-helpers/read-source.mjs";

const render = await import("../src/lib/billing/sales-invoice-render.ts");
const preview = await import("../src/lib/billing/sales-invoice-preview.ts");
const branding = await import("../src/lib/branding/assets.ts");
const companyInfo = await import("../src/lib/company/company-information.ts");
const companyContact = await import("../src/lib/company/company-contact.ts");

const {
  generateSalesInvoicePdf,
  renderSalesInvoiceHtml,
  buildSalesInvoicePdfFilename,
  INVOICE_PDF_LOGO_PUBLIC_PATH,
  loadInvoicePdfLogoBuffer,
} = render;

const { buildPreviewSalesInvoice, OPERATOR_TEST_DOCUMENT_INDICATOR } = preview;
const { BRANDING_ASSETS } = branding;
const { COMPANY_INFORMATION } = companyInfo;
const { COMPANY_CONTACT } = companyContact;

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

function buildIssuedFixture(overrides = {}) {
  const now = "2026-08-15T12:00:00.000Z";
  const pick = (key, fallback) => (Object.hasOwn(overrides, key) ? overrides[key] : fallback);
  return {
    id: pick("id", "11111111-1111-4111-8111-111111111111"),
    organizationId: pick("organizationId", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
    invoiceNumber: pick("invoiceNumber", "ANX-2026-000042"),
    status: pick("status", "issued"),
    currency: "EUR",
    netMinor: pick("netMinor", 15042),
    vatRateBps: pick("vatRateBps", 1900),
    vatMinor: pick("vatMinor", 2858),
    grossMinor: pick("grossMinor", 17900),
    taxPolicyOutcome: "STANDARD_DOMESTIC_VAT",
    businessClassification: "DOMESTIC_B2B",
    reverseChargeApplied: false,
    billingPeriodStart: pick("billingPeriodStart", "2026-08-01"),
    billingPeriodEnd: pick("billingPeriodEnd", "2026-08-31"),
    molliePaymentId: pick("molliePaymentId", "tr_fixture_initial"),
    providerTransactionId: pick("providerTransactionId", "tr_fixture_initial"),
    buyerLegalName: pick("buyerLegalName", "Snapshot Buyer GmbH"),
    buyerVatId: pick("buyerVatId", "DE123456789"),
    buyerCountryCode: pick("buyerCountryCode", "DE"),
    buyerAddressLine1: pick("buyerAddressLine1", "Musterstraße 10"),
    buyerAddressLine2: pick("buyerAddressLine2", null),
    buyerPostalCode: pick("buyerPostalCode", "80331"),
    buyerCity: pick("buyerCity", "München"),
    buyerBillingEmail: pick("buyerBillingEmail", "billing@snapshot-buyer.example"),
    sellerSnapshot: pick("sellerSnapshot", {
      legalName: COMPANY_INFORMATION.legalName,
      vatId: COMPANY_INFORMATION.vatId,
      countryCode: "DE",
      addressLines: [
        COMPANY_INFORMATION.street,
        `${COMPANY_INFORMATION.postalCode} ${COMPANY_INFORMATION.city}`,
        COMPANY_INFORMATION.country,
      ],
      configStatus: "ready",
    }),
    taxDecisionEvidence: null,
    issuedAt: pick("issuedAt", now),
    lines: pick("lines", [
      {
        description: "Professional — Monthly subscription",
        quantity: 1,
        unitGrossMinor: 17900,
        lineGrossMinor: 17900,
        lineNetMinor: 15042,
        lineVatMinor: 2858,
      },
    ]),
    taxNote: "VAT 19%",
    createdAt: now,
  };
}

test("C1.6: canonical logo is production on-light horizontal wordmark", async () => {
  assert.equal(INVOICE_PDF_LOGO_PUBLIC_PATH, BRANDING_ASSETS.logoHorizontalOnLight);
  assert.equal(INVOICE_PDF_LOGO_PUBLIC_PATH, "/branding/logo-horizontal-on-light.png");

  const absolute = path.join(
    process.cwd(),
    "public",
    INVOICE_PDF_LOGO_PUBLIC_PATH.replace(/^\//, ""),
  );
  assert.equal(fs.existsSync(absolute), true, "canonical logo file must exist on disk");

  const buffer = await loadInvoicePdfLogoBuffer();
  assert.ok(Buffer.isBuffer(buffer));
  assert.ok(buffer.byteLength > 1000);
  assert.equal(buffer.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
});

test("C1.6: production PDF succeeds with seller/buyer/number/totals and no noreply", async () => {
  const invoice = buildIssuedFixture();
  const pdf = await generateSalesInvoicePdf(invoice, {
    preview: false,
    locale: "en",
    compress: false,
  });

  assert.ok(pdf.byteLength > 2000, "PDF with embedded logo should be non-trivial");
  assert.equal(Buffer.from(pdf).subarray(0, 5).toString("utf8"), "%PDF-");

  const text = extractPdfText(pdf);
  const raw = Buffer.from(pdf).toString("latin1");

  assert.match(text, /INVOICE|Invoice/);
  assert.match(text, /ANX-2026-000042/);
  assert.match(text, /Auroranexis AI Solutions/);
  assert.match(text, /DE449657077/);
  assert.match(text, /Im Malerwinkel 4/);
  assert.match(text, /71566/);
  assert.match(text, /Alth/);
  assert.match(text, /Snapshot Buyer GmbH/);
  assert.match(text, /Musterstra/);
  assert.match(text, /80331/);
  assert.match(text, /tr_fixture_initial/);
  assert.match(text, /150[,.]?42|15[,.]042/);
  assert.match(text, /28[,.]?58|2[,.]858/);
  assert.match(text, /179[,.]?00|17[,.]900/);
  assert.match(text, /support@auroranexis\.com/);
  assert.match(text, /sales@auroranexis\.com/);
  assert.match(text, /auroranexis\.com/);

  assert.doesNotMatch(text, /noreply@auroranexis\.com/);
  assert.doesNotMatch(raw, /noreply@auroranexis\.com/);
  assert.doesNotMatch(text, /legal@auroranexis\.com/);
  assert.doesNotMatch(text, /billing@snapshot-buyer\.example/);
  assert.doesNotMatch(text, /Billing email:/);
  assert.doesNotMatch(text, /TEST DOCUMENT/);
  assert.doesNotMatch(text, /11111111-1111-4111-8111-111111111111/);
  assert.doesNotMatch(text, /aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/);
});

test("C1.6: preview PDF uses same renderer with TEST DOCUMENT marker", async () => {
  const { invoice } = buildPreviewSalesInvoice("business");
  const pdf = await generateSalesInvoicePdf(invoice, {
    preview: true,
    locale: "en",
    compress: false,
  });
  const text = extractPdfText(pdf);
  const raw = Buffer.from(pdf).toString("latin1");

  assert.equal(Buffer.from(pdf).subarray(0, 5).toString("utf8"), "%PDF-");
  assert.match(text, /TEST DOCUMENT/);
  assert.match(text, /NOT AN INVOICE/);
  assert.equal(OPERATOR_TEST_DOCUMENT_INDICATOR, "TEST DOCUMENT — NOT AN INVOICE");
  assert.match(text, /TEST-ANX-2026-000001/);
  assert.match(text, /Auroranexis Invoice Test GmbH/);
  assert.doesNotMatch(text, /noreply@auroranexis\.com/);
  assert.doesNotMatch(raw, /noreply@auroranexis\.com/);

  const html = renderSalesInvoiceHtml(invoice, { preview: true, locale: "en" });
  assert.match(html, /TEST DOCUMENT — NOT AN INVOICE/);
  assert.match(html, /logo-horizontal-on-light\.png/);
  assert.doesNotMatch(html, /noreply@auroranexis\.com/);
});

test("C1.6: HTML + PDF renderer source never embeds noreply mailbox", () => {
  const source = readSource("src/lib/billing/sales-invoice-render.ts");
  assert.doesNotMatch(source, /noreply@auroranexis\.com/);
  assert.doesNotMatch(source, /noReplyEmail|NO_REPLY_EMAIL/);
  assert.match(source, /logoHorizontalOnLight|logo-horizontal-on-light\.png/);
  assert.match(source, /preview:\s*false|options\.preview/);
  assert.match(source, /support@|supportEmail/);
  assert.match(source, /sales@|salesEmail/);
  assert.doesNotMatch(source, /formatLegalContactLine|legalEmail/);
  assert.equal(COMPANY_CONTACT.noReplyEmail, "noreply@auroranexis.com");
});

test("C1.6: preview route stays zero-write and shares production renderer", () => {
  const route = readSource("src/app/api/operator/sales-invoice/preview/route.ts");
  assert.match(route, /generateSalesInvoicePdf/);
  assert.match(route, /preview:\s*true/);
  assert.doesNotMatch(route, /issueSalesInvoice/);
  assert.doesNotMatch(route, /allocateInvoiceNumber/);
  assert.doesNotMatch(route, /\.from\(["']sales_invoices["']\)/);
  assert.doesNotMatch(route, /insert\(|update\(|upsert\(/);

  const prod = readSource("src/lib/billing/sales-invoice-pdf.ts");
  assert.match(prod, /preview:\s*false/);
  assert.match(prod, /generateSalesInvoicePdf/);
});

test("C1.6: filename helper unchanged for issued numbers", () => {
  assert.equal(
    buildSalesInvoicePdfFilename("ANX-2026-000042"),
    "auroranexis-invoice-anx-2026-000042.pdf",
  );
});
