/**
 * Customer invoice delivery C1 — behavioral tests (PDF + tenant isolation).
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/customer-invoice-delivery-c1.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource, pathExists } from "./_test-helpers/read-source.mjs";

const buyerSnap = await import("../src/lib/billing/buyer-invoice-snapshot.ts");
const salesInvoice = await import("../src/lib/billing/sales-invoice.ts");
const render = await import("../src/lib/billing/sales-invoice-render.ts");
const history = await import("../src/lib/billing/history-types.ts");
const preview = await import("../src/lib/billing/sales-invoice-preview.ts");

const buildBuyerInvoiceSnapshot = buyerSnap.buildBuyerInvoiceSnapshot;
const formatBuyerInvoiceAddressLines = buyerSnap.formatBuyerInvoiceAddressLines;
const resolveIssuedSalesInvoiceForDownload = salesInvoice.resolveIssuedSalesInvoiceForDownload;
const getBuyerSnapshotFromInvoice = salesInvoice.getBuyerSnapshotFromInvoice;
const generateSalesInvoicePdf = render.generateSalesInvoicePdf;
const buildSalesInvoicePdfFilename = render.buildSalesInvoicePdfFilename;
const buildSalesInvoicePdfDownloadPath = history.buildSalesInvoicePdfDownloadPath;
const buildPreviewSalesInvoice = preview.buildPreviewSalesInvoice;

function extractPdfText(pdfBuffer) {
  // PDFKit (WinAnsi) often emits text as hex TJ arrays: <414e58...> → "ANX..."
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

async function productionPdf(invoice) {
  return generateSalesInvoicePdf(invoice, { preview: false, locale: "en", compress: false });
}

async function previewPdf(invoice) {
  return generateSalesInvoicePdf(invoice, { preview: true, locale: "en", compress: false });
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
      legalName: "Auroranexis Seller Snapshot SE",
      vatId: "DE998877665",
      countryCode: "DE",
      addressLines: ["Seller Way 1", "10115 Berlin", "Germany"],
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

test("buyer snapshot reuses billing-identity fields without inventing values", () => {
  const snap = buildBuyerInvoiceSnapshot({
    organizationId: "org",
    legalName: " Acme ",
    billingEmail: " acme@example.com ",
    countryCode: "de",
    addressLine1: "Street 1",
    addressLine2: null,
    postalCode: "12345",
    city: "Berlin",
    vatId: "DE111",
    vatIdNormalized: "DE111",
    viesStatus: null,
    viesCheckedAt: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
  assert.equal(snap.legalName, "Acme");
  assert.equal(snap.countryCode, "DE");
  assert.equal(snap.billingEmail, "acme@example.com");
  assert.deepEqual(formatBuyerInvoiceAddressLines(snap), ["Street 1", "12345 Berlin"]);

  const empty = buildBuyerInvoiceSnapshot(null);
  assert.equal(empty.legalName, null);
  assert.deepEqual(formatBuyerInvoiceAddressLines(empty), []);
});

test("TEST 1–7: issued invoice produces valid production PDF with correct facts", async () => {
  const invoice = buildIssuedFixture();
  const pdf = await productionPdf(invoice);

  assert.ok(Buffer.isBuffer(pdf) || pdf instanceof Uint8Array);
  assert.ok(pdf.byteLength > 200, "PDF should not be empty");
  const header = Buffer.from(pdf).subarray(0, 5).toString("utf8");
  assert.equal(header, "%PDF-", "TEST 2: PDF header");

  const text = extractPdfText(pdf);
  assert.match(text, /ANX-2026-000042/, "TEST 3: invoice number");
  assert.match(text, /Snapshot Buyer GmbH/, "TEST 4: buyer legal name");
  assert.match(text, /Musterstra/, "TEST 4: buyer street");
  assert.match(text, /80331/, "TEST 4: buyer postal");
  assert.equal(invoice.buyerBillingEmail, "billing@snapshot-buyer.example", "TEST 4: buyer email retained on record");
  assert.doesNotMatch(text, /billing@snapshot-buyer\.example/, "TEST 4: buyer email hidden from Buyer block");
  assert.doesNotMatch(text, /Billing email:/, "TEST 4: no billing email label");
  assert.match(text, /Auroranexis Seller Snapshot SE/, "TEST 5: seller");
  assert.match(text, /DE998877665/, "TEST 5: seller VAT");
  assert.match(text, /150[,.]?42|15[,.]042/, "TEST 6: net");
  assert.match(text, /28[,.]?58|2[,.]858/, "TEST 6: vat");
  assert.match(text, /179[,.]?00|17[,.]900/, "TEST 6: gross");
  assert.doesNotMatch(text, /NON-PRODUCTION/, "TEST 7: no preview watermark");
  assert.doesNotMatch(text, /Not a tax document/, "TEST 7: no preview disclaimer");
});

test("TEST 8: operator preview PDF remains TEST DOCUMENT watermarked", async () => {
  const { invoice } = buildPreviewSalesInvoice("business");
  const pdf = await previewPdf(invoice);
  const text = extractPdfText(pdf);
  assert.match(text, /TEST DOCUMENT/);
  assert.match(text, /NOT AN INVOICE/);
  assert.match(text, /TEST-ANX-2026-000001/);
});

test("TEST 9–11: tenant isolation + unauth denial helpers", () => {
  const orgA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const orgB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const invoiceA = buildIssuedFixture({ organizationId: orgA, id: "inv-a" });

  const own = resolveIssuedSalesInvoiceForDownload({
    invoice: invoiceA,
    organizationId: orgA,
  });
  assert.equal(own?.id, "inv-a", "TEST 9: tenant A owns invoice");

  const cross = resolveIssuedSalesInvoiceForDownload({
    invoice: invoiceA,
    organizationId: orgB,
  });
  assert.equal(cross, null, "TEST 10: tenant A≠B denied");

  const missing = resolveIssuedSalesInvoiceForDownload({
    invoice: null,
    organizationId: orgA,
  });
  assert.equal(missing, null, "TEST 11: missing/unauth path returns null");

  const draft = resolveIssuedSalesInvoiceForDownload({
    invoice: { ...invoiceA, status: "draft" },
    organizationId: orgA,
  });
  assert.equal(draft, null, "non-issued denied");
});

test("download route denies unauthenticated callers and scopes by org", () => {
  const route = readSource("src/app/api/billing/sales-invoices/[invoiceId]/pdf/route.ts");
  const headersHelper = readSource("src/lib/billing/sales-invoice-pdf.ts");
  assert.match(route, /getSession/);
  assert.match(route, /canManageOrganizationSettings/);
  assert.match(route, /generateIssuedSalesInvoicePdfForOrganization/);
  assert.match(route, /status:\s*401/);
  assert.match(route, /Invoice not found/);
  assert.match(route, /salesInvoicePdfResponseHeaders/);
  assert.match(headersHelper, /application\/pdf/);
  assert.match(headersHelper, /attachment/);
  assert.match(headersHelper, /no-store/);
  assert.doesNotMatch(route, /preview:\s*true/);
  assert.match(headersHelper, /preview:\s*false/);
});

test("TEST 12: repeated production PDF download does not issue invoices", async () => {
  const invoice = buildIssuedFixture({ invoiceNumber: "ANX-2026-000099" });
  const pdf1 = await productionPdf(invoice);
  const pdf2 = await productionPdf(invoice);
  assert.match(extractPdfText(pdf1), /ANX-2026-000099/);
  assert.match(extractPdfText(pdf2), /ANX-2026-000099/);
  assert.equal(invoice.invoiceNumber, "ANX-2026-000099");

  const pdfModule = readSource("src/lib/billing/sales-invoice-pdf.ts");
  assert.match(pdfModule, /preview:\s*false/);
  assert.doesNotMatch(pdfModule, /issueSalesInvoice/);
  assert.match(pdfModule, /Read-only|never issues/i);
});

test("TEST 13: post-issue identity change does not alter PDF snapshot", async () => {
  const invoice = buildIssuedFixture({
    buyerLegalName: "Frozen Buyer AG",
    buyerAddressLine1: "Frozen Street 1",
    buyerCity: "Hamburg",
    buyerPostalCode: "20095",
    buyerBillingEmail: "frozen@example.com",
  });

  // Simulate mutable live identity changing after issue — must not be read by PDF path.
  const liveIdentity = {
    organizationId: invoice.organizationId,
    legalName: "MUTATED LIVE NAME",
    billingEmail: "mutated@example.com",
    countryCode: "FR",
    addressLine1: "Mutated Ave 9",
    addressLine2: null,
    postalCode: "75001",
    city: "Paris",
    vatId: "FR999",
    vatIdNormalized: "FR999",
    viesStatus: null,
    viesCheckedAt: null,
    updatedAt: "2026-12-01T00:00:00.000Z",
  };
  void liveIdentity;

  const fromInvoice = getBuyerSnapshotFromInvoice(invoice);
  assert.equal(fromInvoice.legalName, "Frozen Buyer AG");
  assert.equal(fromInvoice.billingEmail, "frozen@example.com");
  assert.notEqual(fromInvoice.legalName, liveIdentity.legalName);

  const pdf = await productionPdf(invoice);
  const text = extractPdfText(pdf);
  assert.match(text, /Frozen Buyer AG/);
  assert.match(text, /Frozen Street 1/);
  assert.match(text, /Hamburg/);
  assert.doesNotMatch(text, /frozen@example\.com/, "buyer email retained on snapshot only");
  assert.doesNotMatch(text, /MUTATED LIVE NAME/);
  assert.doesNotMatch(text, /Mutated Ave/);
  assert.doesNotMatch(text, /mutated@example\.com/);
});

test("TEST 14: recurring-issued invoice uses same production PDF path", async () => {
  const renewal = buildIssuedFixture({
    id: "22222222-2222-4222-8222-222222222222",
    invoiceNumber: "ANX-2026-000043",
    molliePaymentId: "tr_fixture_renewal",
    providerTransactionId: "tr_fixture_renewal",
    billingPeriodStart: "2026-09-01",
    billingPeriodEnd: "2026-09-30",
    lines: [
      {
        description: "Professional — Monthly subscription (renewal)",
        quantity: 1,
        unitGrossMinor: 17900,
        lineGrossMinor: 17900,
        lineNetMinor: 15042,
        lineVatMinor: 2858,
      },
    ],
  });
  const pdf = await productionPdf(renewal);
  const text = extractPdfText(pdf);
  assert.match(text, /ANX-2026-000043/);
  assert.match(text, /renewal/i);
  assert.equal(buildSalesInvoicePdfDownloadPath(renewal.id), `/api/billing/sales-invoices/${renewal.id}/pdf`);
});

test("TEST 15: Billing action targets Auroranexis invoice, Mollie labeled Payment receipt", () => {
  const panel = readSource("src/components/settings/billing-history-panel.tsx");
  const actions = readSource("src/lib/billing/invoice-actions.ts");
  assert.match(panel, /Download invoice/);
  assert.match(panel, /Payment receipt/);
  assert.match(panel, /downloadSalesInvoicePdfAction/);
  assert.match(panel, /openInvoicePdfAction/);
  assert.match(actions, /downloadSalesInvoicePdfAction/);
  assert.match(actions, /buildSalesInvoicePdfDownloadPath/);
  assert.match(actions, /getSalesInvoiceForOrganization|getSalesInvoiceByProviderTransactionId/);
  assert.match(actions, /payment receipt/i);
  // Mollie receipt opener must not be labeled as invoice PDF in UI copy for the invoice button.
  assert.match(panel, /Auroranexis sales invoices/);
  assert.match(panel, /Mollie payment receipts/);
});

test("historical pre-snapshot invoices render safely without fabricated address", async () => {
  const legacy = buildIssuedFixture({
    buyerAddressLine1: null,
    buyerAddressLine2: null,
    buyerPostalCode: null,
    buyerCity: null,
    buyerBillingEmail: null,
    buyerLegalName: "Legacy Buyer GmbH",
    buyerCountryCode: "DE",
    buyerVatId: "DE000",
  });
  const pdf = await productionPdf(legacy);
  const text = extractPdfText(pdf);
  assert.match(text, /Legacy Buyer GmbH/);
  assert.match(text, /Country: DE/);

  // HTML path is authoritative for absent optional fields (PDF hex decode can false-positive).
  const html = render.renderSalesInvoiceHtml(legacy, { preview: false });
  assert.match(html, /Legacy Buyer GmbH/);
  assert.doesNotMatch(html, /Billing email:/);
  assert.doesNotMatch(html, /Musterstra/);
});

test("migration + issuance wire buyer snapshot columns", () => {
  assert.equal(
    pathExists("supabase/migrations/20250827100000_sales_invoice_buyer_snapshot.sql"),
    true,
  );
  const migration = readSource(
    "supabase/migrations/20250827100000_sales_invoice_buyer_snapshot.sql",
  );
  assert.match(migration, /buyer_address_line1/);
  assert.match(migration, /buyer_billing_email/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS/);

  const issue = readSource("src/lib/billing/sales-invoice.ts");
  assert.match(issue, /buyer_address_line1/);
  assert.match(issue, /buyerSnapshot/);
  assert.match(issue, /resolveIssuedSalesInvoiceForDownload/);

  const fromMollie = readSource("src/lib/billing/sales-invoice-from-mollie.ts");
  assert.match(fromMollie, /buildBuyerInvoiceSnapshot/);
  assert.match(fromMollie, /buyerSnapshot/);

  const filename = buildSalesInvoicePdfFilename("ANX-2026-000042");
  assert.equal(filename, "auroranexis-invoice-anx-2026-000042.pdf");
});

test("live charging gate remains fail-closed; C1 does not enable LIVE", async () => {
  const rollout = await import("../src/lib/billing/providers/mollie/rollout.ts");
  assert.equal(typeof rollout.isMollieLiveChargingEnabled, "function");
  assert.equal(rollout.isMollieLiveChargingEnabled(), false);
  const pdfRoute = readSource("src/app/api/billing/sales-invoices/[invoiceId]/pdf/route.ts");
  assert.doesNotMatch(pdfRoute, /MOLLIE_LIVE_CHARGING_ENABLED/);
  assert.doesNotMatch(pdfRoute, /sendEmail|sales_invoice_issued/);
});
