/**
 * C3.1 — Production invoice numbering authority + customer presentation cleanup.
 *
 * Behavioral coverage (A–H) plus country presentation / Mollie footer removal.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/invoice-numbering-c3-1.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const countryMod = await import("../src/lib/i18n/country.ts");
const preview = await import("../src/lib/billing/sales-invoice-preview.ts");
const render = await import("../src/lib/billing/sales-invoice-render.ts");
const emailMod = await import("../src/lib/billing/sales-invoice-email.ts");
const templateMod = await import("../src/lib/email/templates/sales-invoice.ts");
const tax = await import("../src/lib/billing/tax-policy.ts");
const taxes = await import("../src/lib/billing/taxes.ts");

const { formatInvoiceCountryName } = countryMod;
const { buildPreviewSalesInvoice } = preview;
const { renderSalesInvoiceHtml, generateSalesInvoicePdf } = render;
const { determineTaxPolicy } = tax;
const { calculateVatInclusiveBreakdown } = taxes;

const MIGRATION = "supabase/migrations/20250824100000_p1_002_pricing_tax_invoice_contracting.sql";
const YEAR = 2026;

/**
 * Pure model of allocate_sales_invoice_number:
 * counters keyed by year only (not country) → ANX-YYYY-######.
 */
function simulateAllocate(counters, year) {
  const next = (counters.get(year) ?? 0) + 1;
  counters.set(year, next);
  return `ANX-${year}-${String(next).padStart(6, "0")}`;
}

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
    molliePaymentId: pick("molliePaymentId", "tr_fixture_business"),
    providerTransactionId: pick("providerTransactionId", "tr_fixture_business"),
    buyerLegalName: pick("buyerLegalName", "Snapshot Buyer GmbH"),
    buyerVatId: pick("buyerVatId", "DE123456789"),
    buyerCountryCode: pick("buyerCountryCode", "DE"),
    buyerAddressLine1: pick("buyerAddressLine1", "Musterstraße 10"),
    buyerAddressLine2: null,
    buyerPostalCode: pick("buyerPostalCode", "80331"),
    buyerCity: pick("buyerCity", "München"),
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
        description: "Business — Monthly subscription",
        quantity: 1,
        unitGrossMinor: 59_900,
        lineGrossMinor: 59_900,
        lineNetMinor: 50_336,
        lineVatMinor: 9_564,
      },
    ],
    taxNote: "German VAT (19%)",
    createdAt: now,
  };
}

test("authority: single central year series — no country multi-series", () => {
  const migration = readSource(MIGRATION);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.sales_invoice_number_counters/);
  assert.match(migration, /PRIMARY KEY \(year\)/);
  assert.doesNotMatch(migration, /country.*PRIMARY KEY|PRIMARY KEY.*country/i);
  assert.match(
    migration,
    /RETURN 'ANX-' \|\| p_year::text \|\| '-' \|\| lpad\(next_val::text, 6, '0'\)/,
  );
  assert.match(migration, /ON CONFLICT \(year\)\s+DO UPDATE SET last_value = c\.last_value \+ 1/s);

  const issue = readSource("src/lib/billing/sales-invoice.ts");
  assert.match(issue, /allocate_sales_invoice_number/);
  assert.match(issue, /p_organization_id/);
  assert.match(issue, /p_year/);
  assert.doesNotMatch(issue, /p_country|buyerCountryCode.*allocate|allocate.*country/i);
  assert.doesNotMatch(issue, /randomUUID/);
  assert.match(issue, /Failed to allocate sales invoice number/);
  assert.match(issue, /\^ANX-\\d\{4\}-\\d\{6\}\$/);
});

test("TEST A–C: sequential central series across countries", () => {
  const counters = new Map();
  const a = simulateAllocate(counters, YEAR);
  const b = simulateAllocate(counters, YEAR);
  const cFr = simulateAllocate(counters, YEAR);
  const dNl = simulateAllocate(counters, YEAR);
  const eDe = simulateAllocate(counters, YEAR);

  assert.equal(a, "ANX-2026-000001");
  assert.equal(b, "ANX-2026-000002");
  assert.equal(cFr, "ANX-2026-000003");
  assert.equal(dNl, "ANX-2026-000004");
  assert.equal(eDe, "ANX-2026-000005");
  assert.equal(new Set([a, b, cFr, dNl, eDe]).size, 5);
});

test("TEST D: duplicate payment reconciliation does not allocate again", () => {
  const fromMollie = readSource("src/lib/billing/sales-invoice-from-mollie.ts");
  assert.match(fromMollie, /provider_transaction_id/);
  assert.match(fromMollie, /maybeSingle\(\)/);
  assert.match(fromMollie, /if \(existing\) \{\s*return;/s);

  const migration = readSource(MIGRATION);
  assert.match(migration, /idx_sales_invoices_provider_tx_unique/);
  assert.match(migration, /UNIQUE \(invoice_number\)|sales_invoices_invoice_number_unique/);
});

test("TEST E: concurrent allocation cannot duplicate", async () => {
  const counters = new Map();
  let gate = Promise.resolve();
  async function allocateExclusive(year) {
    const prev = gate;
    let release;
    gate = new Promise((r) => {
      release = r;
    });
    await prev;
    try {
      return simulateAllocate(counters, year);
    } finally {
      release();
    }
  }

  const results = await Promise.all(
    Array.from({ length: 40 }, () => allocateExclusive(YEAR)),
  );
  assert.equal(new Set(results).size, 40);
  assert.equal(results.sort().at(-1), "ANX-2026-000040");
  assert.ok(results.includes("ANX-2026-000001"));
});

test("TEST F: preview isolates TEST numbers — zero counter / allocate / writes", () => {
  const previewSrc = readSource("src/lib/billing/sales-invoice-preview.ts");
  assert.doesNotMatch(previewSrc, /allocate_sales_invoice_number|issueSalesInvoice|createAdminClient/);
  assert.match(previewSrc, /TEST-ANX-2026/);

  const { invoice: de } = buildPreviewSalesInvoice("business", "de");
  const { invoice: fr } = buildPreviewSalesInvoice("business", "fr");
  const { invoice: nl } = buildPreviewSalesInvoice("business", "nl");
  assert.equal(de.invoiceNumber, "TEST-ANX-2026-000001");
  assert.equal(fr.invoiceNumber, "TEST-ANX-2026-FR-000001");
  assert.equal(nl.invoiceNumber, "TEST-ANX-2026-NL-000001");
  assert.match(de.invoiceNumber, /^TEST-/);
  assert.match(fr.invoiceNumber, /^TEST-/);
  assert.match(nl.invoiceNumber, /^TEST-/);

  const route = readSource("src/app/api/operator/sales-invoice/preview/route.ts");
  assert.doesNotMatch(route, /issueSalesInvoice|allocate_sales_invoice_number/);
});

test("TEST G: C2 email uses persisted invoice_number", () => {
  const emailSrc = readSource("src/lib/billing/sales-invoice-email.ts");
  assert.match(emailSrc, /invoice\.invoiceNumber/);
  assert.doesNotMatch(emailSrc, /allocate_sales_invoice_number|ANX-\$\{/);

  const template = templateMod.buildSalesInvoiceIssuedPlainText({
    buyerLegalName: "Buyer",
    invoiceNumber: "ANX-2026-000042",
    invoiceDateLabel: "15 Aug 2026",
    billingPeriodLabel: null,
    totalLabel: "€599.00",
    currency: "EUR",
  });
  assert.match(template, /ANX-2026-000042/);
  assert.doesNotMatch(template, /TEST-ANX/);
});

test("TEST H: PDF uses persisted invoice_number", async () => {
  const invoice = buildIssuedFixture({ invoiceNumber: "ANX-2026-000099" });
  const pdf = await generateSalesInvoicePdf(invoice, { preview: false, compress: false });
  const text = extractPdfText(pdf);
  assert.match(text, /ANX-2026-000099/);
  assert.doesNotMatch(text, /TEST-ANX/);

  const html = renderSalesInvoiceHtml(invoice, { preview: false });
  assert.match(html, /ANX-2026-000099/);

  const renderSrc = readSource("src/lib/billing/sales-invoice-render.ts");
  assert.doesNotMatch(renderSrc, /allocate_sales_invoice_number|issueSalesInvoice/);
});

test("DB unique constraint on invoice_number", () => {
  const migration = readSource(MIGRATION);
  assert.match(migration, /CONSTRAINT sales_invoices_invoice_number_unique UNIQUE \(invoice_number\)/);
});

test("country presentation: DE→Germany, FR→France, NL→Netherlands", async () => {
  assert.equal(formatInvoiceCountryName("DE"), "Germany");
  assert.equal(formatInvoiceCountryName("FR"), "France");
  assert.equal(formatInvoiceCountryName("NL"), "Netherlands");
  assert.equal(formatInvoiceCountryName("ZZ"), null);
  assert.equal(formatInvoiceCountryName("DEU"), null);
  assert.equal(formatInvoiceCountryName(null), null);

  const { invoice: de } = buildPreviewSalesInvoice("business", "de");
  const { invoice: fr } = buildPreviewSalesInvoice("business", "fr");
  const { invoice: nl } = buildPreviewSalesInvoice("business", "nl");
  assert.equal(de.buyerCountryCode, "DE");
  assert.equal(fr.buyerCountryCode, "FR");
  assert.equal(nl.buyerCountryCode, "NL");

  const deHtml = renderSalesInvoiceHtml(de, { preview: true });
  const frHtml = renderSalesInvoiceHtml(fr, { preview: true });
  const nlHtml = renderSalesInvoiceHtml(nl, { preview: true });
  assert.match(deHtml, />Germany</);
  assert.match(frHtml, />France</);
  assert.match(nlHtml, />Netherlands</);
  assert.doesNotMatch(deHtml, /Country:\s*DE/);
  assert.doesNotMatch(frHtml, /Country:\s*FR/);
  assert.doesNotMatch(nlHtml, /Country:\s*NL/);

  const frPdf = extractPdfText(
    await generateSalesInvoicePdf(fr, { preview: true, compress: false }),
  );
  assert.match(frPdf, /France/);
  assert.doesNotMatch(frPdf, /Country:\s*FR/);
});

test("Mollie explanatory architecture text absent from customer invoice", async () => {
  const banned = /Auroranexis sales invoices are distinct from Mollie payment receipts/;
  const renderSrc = readSource("src/lib/billing/sales-invoice-render.ts");
  assert.doesNotMatch(renderSrc, banned);

  const { invoice } = buildPreviewSalesInvoice("business", "de");
  const html = renderSalesInvoiceHtml(invoice, { preview: true });
  assert.doesNotMatch(html, banned);
  assert.doesNotMatch(html, /Mollie is PSP|Payment processed by Mollie|This is not a Mollie invoice/i);

  const pdfText = extractPdfText(
    await generateSalesInvoicePdf(invoice, { preview: true, compress: false }),
  );
  assert.doesNotMatch(pdfText, banned);

  const production = buildIssuedFixture();
  const prodHtml = renderSalesInvoiceHtml(production, { preview: false });
  assert.doesNotMatch(prodHtml, banned);
});

test("C3 tax paths frozen under C3.1 presentation changes", () => {
  const de = determineTaxPolicy({
    customerCountryCode: "DE",
    vatId: "DE123456789",
    viesStatus: "not_checked",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(de.outcome, "STANDARD_DOMESTIC_VAT");
  assert.equal(de.vatRateBps, 1900);
  const deBreak = calculateVatInclusiveBreakdown({
    grossMinor: 59_900,
    determination: de,
  });
  assert.equal(deBreak.netMinor, 50_336);
  assert.equal(deBreak.vatMinor, 9_564);
  assert.equal(deBreak.grossMinor, 59_900);

  const fr = determineTaxPolicy({
    customerCountryCode: "FR",
    vatId: "FR12345678901",
    viesStatus: "valid",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(fr.outcome, "REVERSE_CHARGE");
  const frBreak = calculateVatInclusiveBreakdown({
    grossMinor: 59_900,
    determination: fr,
  });
  assert.equal(frBreak.netMinor, 59_900);
  assert.equal(frBreak.vatMinor, 0);

  const invalid = determineTaxPolicy({
    customerCountryCode: "FR",
    vatId: "FR12345678901",
    viesStatus: "invalid",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(invalid.blocksCheckout, true);
  assert.notEqual(invalid.outcome, "REVERSE_CHARGE");
});

test("payment reference policy preserved; C2 recipient helper unchanged", () => {
  const invoice = buildIssuedFixture({ providerTransactionId: "tr_prod_ref_1" });
  const html = renderSalesInvoiceHtml(invoice, { preview: false });
  assert.match(html, /tr_prod_ref_1/);

  const recipient = emailMod.resolveIssuedInvoiceEmailRecipient(invoice);
  assert.equal(recipient, "billing@snapshot-buyer.example");
});
