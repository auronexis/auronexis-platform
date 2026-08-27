/**
 * Phase C2.1 — Invoice content + contact hardening.
 *
 * Coverage:
 * - noreply / no-reply / .invalid absent from customer-visible invoice surfaces
 * - support@ + sales@ + auroranexis.com present; legal@ not used as invoice contact
 * - buyer_billing_email retained for C2 recipient; hidden from Buyer block
 * - customer line description professional; eur-v1-* hidden
 * - German VAT (19%) only for STANDARD_DOMESTIC_VAT @ 1900
 * - NET+VAT=GROSS from persisted amounts; preview zero-write; C2 email architecture
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/customer-invoice-content-c2-1.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const copy = await import("../src/lib/billing/sales-invoice-customer-copy.ts");
const preview = await import("../src/lib/billing/sales-invoice-preview.ts");
const render = await import("../src/lib/billing/sales-invoice-render.ts");
const emailMod = await import("../src/lib/billing/sales-invoice-email.ts");
const templateMod = await import("../src/lib/email/templates/sales-invoice.ts");
const companyContact = await import("../src/lib/company/company-contact.ts");

const {
  buildCustomerSalesInvoiceLineDescription,
  toCustomerVisibleInvoiceLineDescription,
  buildGermanDomesticVatTaxNote,
  resolveCustomerInvoiceTaxNote,
} = copy;
const { buildPreviewSalesInvoice, OPERATOR_VISUAL_ACCEPTANCE_BUYER } = preview;
const { generateSalesInvoicePdf, renderSalesInvoiceHtml } = render;
const { resolveIssuedInvoiceEmailRecipient } = emailMod;
const { buildSalesInvoiceIssuedTemplateKey, buildSalesInvoiceIssuedHtml, buildSalesInvoiceIssuedPlainText } =
  templateMod;
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
    status: "issued",
    currency: "EUR",
    netMinor: 50_336,
    vatRateBps: 1900,
    vatMinor: 9_564,
    grossMinor: 59_900,
    taxPolicyOutcome: "STANDARD_DOMESTIC_VAT",
    businessClassification: "DOMESTIC_B2B",
    reverseChargeApplied: false,
    billingPeriodStart: "2026-08-01",
    billingPeriodEnd: "2026-08-31",
    molliePaymentId: "tr_fixture_business",
    providerTransactionId: "tr_fixture_business",
    buyerLegalName: "Snapshot Buyer GmbH",
    buyerVatId: "DE123456789",
    buyerCountryCode: "DE",
    buyerAddressLine1: "Musterstraße 10",
    buyerAddressLine2: null,
    buyerPostalCode: "80331",
    buyerCity: "München",
    buyerBillingEmail: pick("buyerBillingEmail", "billing@snapshot-buyer.example"),
    sellerSnapshot: {
      legalName: "Auroranexis Seller Snapshot SE",
      vatId: "DE998877665",
      countryCode: "DE",
      addressLines: ["Seller Way 1", "10115 Berlin", "Germany"],
      configStatus: "ready",
    },
    taxDecisionEvidence: null,
    issuedAt: now,
    lines: [
      {
        description: pick(
          "lineDescription",
          "Business — Monthly subscription (eur-v1-2026-08)",
        ),
        quantity: 1,
        unitGrossMinor: 59_900,
        lineGrossMinor: 59_900,
        lineNetMinor: 50_336,
        lineVatMinor: 9_564,
      },
    ],
    taxNote: pick("taxNote", "VAT (19%)"),
    createdAt: now,
  };
}

test("C2.1: customer line description is professional and hides eur-v1", () => {
  assert.equal(
    buildCustomerSalesInvoiceLineDescription("Business"),
    "Auroranexis Business — Monthly SaaS subscription",
  );
  assert.equal(
    toCustomerVisibleInvoiceLineDescription("Business — Monthly subscription (eur-v1-2026-08)"),
    "Auroranexis Business — Monthly SaaS subscription",
  );
  assert.equal(
    toCustomerVisibleInvoiceLineDescription("Professional renewal"),
    "Auroranexis Professional — Monthly SaaS subscription",
  );
  assert.doesNotMatch(
    toCustomerVisibleInvoiceLineDescription("Business subscription (eur-v1-2026-08)"),
    /eur-v1/,
  );
  assert.match(
    toCustomerVisibleInvoiceLineDescription("Upgrade adjustment — Business"),
    /Upgrade adjustment/,
  );
});

test("C2.1: German VAT note only for domestic 19% path", () => {
  assert.equal(
    buildGermanDomesticVatTaxNote({
      taxPolicyOutcome: "STANDARD_DOMESTIC_VAT",
      vatRateBps: 1900,
    }),
    "German VAT (19%)",
  );
  assert.equal(
    buildGermanDomesticVatTaxNote({
      taxPolicyOutcome: "REVERSE_CHARGE",
      vatRateBps: 0,
    }),
    null,
  );
  assert.equal(
    resolveCustomerInvoiceTaxNote({
      taxPolicyOutcome: "STANDARD_DOMESTIC_VAT",
      vatRateBps: 1900,
      taxNote: "VAT (19%)",
    }),
    "German VAT (19%)",
  );
});

test("C2.1: Business PDF money 503.36 / 95.64 / 599; contacts hardened", async () => {
  const invoice = buildIssuedFixture();
  assert.equal(invoice.netMinor + invoice.vatMinor, invoice.grossMinor);

  const pdf = await generateSalesInvoicePdf(invoice, {
    preview: false,
    locale: "en",
    compress: false,
  });
  const text = extractPdfText(pdf);
  const html = renderSalesInvoiceHtml(invoice, { preview: false, locale: "en" });

  assert.match(text, /503[,.]?36|50[,.]336/);
  assert.match(text, /95[,.]?64|9[,.]564/);
  assert.match(text, /599[,.]?00|59[,.]900/);
  assert.match(html, /Auroranexis Business — Monthly SaaS subscription/);
  assert.doesNotMatch(html, /eur-v1/);
  assert.doesNotMatch(text, /eur-v1/);
  assert.match(html, /German VAT \(19%\)/);
  assert.match(html, /support@auroranexis\.com/);
  assert.match(html, /sales@auroranexis\.com/);
  assert.match(html, /auroranexis\.com/);
  assert.doesNotMatch(html, /noreply@/);
  assert.doesNotMatch(html, /no-reply@/);
  assert.doesNotMatch(html, /legal@auroranexis\.com/);
  assert.doesNotMatch(html, /Billing email:/);
  assert.doesNotMatch(html, /billing@snapshot-buyer\.example/);
  assert.doesNotMatch(html, /\.invalid/);
  assert.equal(invoice.buyerBillingEmail, "billing@snapshot-buyer.example");
});

test("C2.1: preview Business model has professional description and retains billing email for recipient", () => {
  const { invoice } = buildPreviewSalesInvoice("business");
  assert.equal(invoice.grossMinor, 59_900);
  assert.equal(invoice.netMinor, 50_336);
  assert.equal(invoice.vatMinor, 9_564);
  assert.equal(invoice.netMinor + invoice.vatMinor, invoice.grossMinor);
  assert.equal(
    invoice.lines[0].description,
    "Auroranexis Business — Monthly SaaS subscription",
  );
  assert.doesNotMatch(invoice.lines[0].description, /eur-v1/);
  assert.equal(invoice.taxNote, "German VAT (19%)");
  assert.equal(invoice.buyerBillingEmail, OPERATOR_VISUAL_ACCEPTANCE_BUYER.billingEmail);
  assert.match(invoice.buyerBillingEmail, /\.invalid$/);

  const html = renderSalesInvoiceHtml(invoice, { preview: true, locale: "en" });
  assert.match(html, /TEST DOCUMENT/);
  assert.doesNotMatch(html, /Billing email:/);
  assert.doesNotMatch(html, /invoice-test@auroranexis\.invalid/);
  assert.doesNotMatch(html, /noreply@/);
  assert.doesNotMatch(html, /legal@auroranexis\.com/);
  assert.match(html, /support@auroranexis\.com/);
  assert.match(html, /sales@auroranexis\.com/);
});

test("C2.1: C2 recipient / Reply-To / idempotency preserved", () => {
  const invoice = buildIssuedFixture();
  assert.equal(
    resolveIssuedInvoiceEmailRecipient(invoice),
    "billing@snapshot-buyer.example",
  );
  assert.equal(
    buildSalesInvoiceIssuedTemplateKey(invoice.id),
    `sales_invoice:${invoice.id}:issued`,
  );

  const emailSource = readSource("src/lib/billing/sales-invoice-email.ts");
  assert.match(emailSource, /replyTo:\s*COMPANY_CONTACT\.supportEmail/);
  assert.match(emailSource, /preview:\s*false/);
  assert.match(emailSource, /generateSalesInvoicePdf|generatePdf/);
  assert.equal(COMPANY_CONTACT.supportEmail, "support@auroranexis.com");

  const html = buildSalesInvoiceIssuedHtml({
    buyerLegalName: "Buyer",
    invoiceNumber: "ANX-1",
    invoiceDateLabel: "Aug 15, 2026",
    billingPeriodLabel: null,
    totalLabel: "€599.00",
    currency: "EUR",
  });
  const text = buildSalesInvoiceIssuedPlainText({
    buyerLegalName: "Buyer",
    invoiceNumber: "ANX-1",
    invoiceDateLabel: "Aug 15, 2026",
    billingPeriodLabel: null,
    totalLabel: "€599.00",
    currency: "EUR",
  });
  assert.match(html, /support@auroranexis\.com/);
  assert.match(html, /sales@auroranexis\.com/);
  assert.match(text, /support@auroranexis\.com/);
  assert.match(text, /sales@auroranexis\.com/);
  assert.doesNotMatch(html, /noreply@/);
  assert.doesNotMatch(text, /noreply@/);
  assert.doesNotMatch(html, /legal@auroranexis\.com/);
});

test("C2.1: shared production renderer for download + email; preview zero-write", () => {
  const pdfHelper = readSource("src/lib/billing/sales-invoice-pdf.ts");
  const email = readSource("src/lib/billing/sales-invoice-email.ts");
  const previewRoute = readSource("src/app/api/operator/sales-invoice/preview/route.ts");
  const previewMod = readSource("src/lib/billing/sales-invoice-preview.ts");
  const renderSrc = readSource("src/lib/billing/sales-invoice-render.ts");

  assert.match(pdfHelper, /generateSalesInvoicePdf/);
  assert.match(pdfHelper, /preview:\s*false/);
  assert.match(email, /generateSalesInvoicePdf|generatePdf/);
  assert.match(email, /preview:\s*false/);
  assert.match(previewRoute, /preview:\s*true/);
  assert.doesNotMatch(previewRoute, /issueSalesInvoice/);
  assert.doesNotMatch(previewRoute, /insert\(|update\(|upsert\(/);
  assert.doesNotMatch(previewMod, /issueSalesInvoice/);
  assert.match(renderSrc, /salesEmail|sales@/);
  assert.doesNotMatch(renderSrc, /formatLegalContactLine/);
  assert.doesNotMatch(renderSrc, /Billing email:/);
});
