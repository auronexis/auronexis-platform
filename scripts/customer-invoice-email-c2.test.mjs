/**
 * Customer invoice delivery C2 — transactional invoice email + production PDF attachment.
 *
 * Behavioral coverage:
 * - issued invoice → PDF + email delivery requested
 * - same invoice twice → one logical delivery
 * - different renewal invoice → new delivery
 * - PDF failure → no email claim of attachment; invoice untouched
 * - email failure → invoice untouched; failure recorded
 * - missing recipient → safe fail; no owner/admin fallback
 * - production renderer (preview:false); no customer-visible noreply
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/customer-invoice-email-c2.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const emailMod = await import("../src/lib/billing/sales-invoice-email.ts");
const templateMod = await import("../src/lib/email/templates/sales-invoice.ts");
const render = await import("../src/lib/billing/sales-invoice-render.ts");
const companyContact = await import("../src/lib/company/company-contact.ts");

const {
  deliverIssuedSalesInvoiceEmail,
  resolveIssuedInvoiceEmailRecipient,
} = emailMod;
const {
  buildSalesInvoiceIssuedTemplateKey,
  buildSalesInvoiceIssuedSubject,
  buildSalesInvoiceIssuedHtml,
  buildSalesInvoiceIssuedPlainText,
  sanitizeEmailHeaderValue,
} = templateMod;
const { generateSalesInvoicePdf, buildSalesInvoicePdfFilename } = render;
const { COMPANY_CONTACT } = companyContact;

function buildIssuedFixture(overrides = {}) {
  const now = "2026-08-15T12:00:00.000Z";
  const pick = (key, fallback) => (Object.hasOwn(overrides, key) ? overrides[key] : fallback);
  return {
    id: pick("id", "11111111-1111-4111-8111-111111111111"),
    organizationId: pick("organizationId", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
    invoiceNumber: pick("invoiceNumber", "ANX-2026-000042"),
    status: pick("status", "issued"),
    currency: "EUR",
    netMinor: 15042,
    vatRateBps: 1900,
    vatMinor: 2858,
    grossMinor: 17900,
    taxPolicyOutcome: "STANDARD_DOMESTIC_VAT",
    businessClassification: "DOMESTIC_B2B",
    reverseChargeApplied: false,
    billingPeriodStart: pick("billingPeriodStart", "2026-08-01"),
    billingPeriodEnd: pick("billingPeriodEnd", "2026-08-31"),
    molliePaymentId: "tr_fixture_initial",
    providerTransactionId: "tr_fixture_initial",
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
        description: "Professional — Monthly subscription",
        quantity: 1,
        unitGrossMinor: 17900,
        lineGrossMinor: 17900,
        lineNetMinor: 15042,
        lineVatMinor: 2858,
      },
    ],
    taxNote: "VAT 19%",
    createdAt: now,
  };
}

function createHarness(options = {}) {
  const claimedKeys = new Set();
  const finalizations = [];
  const sends = [];
  let claimCount = 0;
  let sendCount = 0;
  let pdfCalls = [];

  const generatePdf =
    options.generatePdf ??
    (async (invoice, opts) => {
      pdfCalls.push({ invoiceId: invoice.id, preview: opts?.preview });
      if (options.pdfFails) {
        throw new Error("pdf boom");
      }
      return Buffer.from("%PDF-1.4 fixture");
    });

  return {
    pdfCalls,
    finalizations,
    sends,
    get claimCount() {
      return claimCount;
    },
    get sendCount() {
      return sendCount;
    },
    deps: {
      generatePdf,
      resolveLedgerUser: async () =>
        options.ledgerUser === null
          ? null
          : (options.ledgerUser ?? {
              userId: "user-owner-1",
              email: "owner@example.com",
            }),
      claim: async ({ templateKey }) => {
        claimCount += 1;
        if (claimedKeys.has(templateKey) && !options.allowReclaim) {
          return { claimed: false, deliveryId: null };
        }
        claimedKeys.add(templateKey);
        return { claimed: true, deliveryId: `delivery-${templateKey}` };
      },
      finalize: async (input) => {
        finalizations.push(input);
      },
      sendClaimed: async (input) => {
        sendCount += 1;
        sends.push(input);
        if (options.sendFails) {
          finalizations.push({
            deliveryId: input.deliveryId,
            status: "failed",
            errorCode: "provider_send_failed",
          });
          return { success: false, error: "provider down" };
        }
        return { success: true, messageId: "msg-1" };
      },
    },
  };
}

test("C2 CASE 1: issued invoice requests production PDF + email with attachment", async () => {
  const invoice = buildIssuedFixture();
  const harness = createHarness();
  const result = await deliverIssuedSalesInvoiceEmail(invoice, harness.deps);

  assert.equal(result.success, true);
  assert.equal(harness.claimCount, 1);
  assert.equal(harness.sendCount, 1);
  assert.equal(harness.pdfCalls[0]?.preview, false);
  assert.equal(harness.sends[0].to, "billing@snapshot-buyer.example");
  assert.notEqual(harness.sends[0].to, "owner@example.com");
  assert.equal(harness.sends[0].replyTo, COMPANY_CONTACT.supportEmail);
  assert.equal(harness.sends[0].attachments?.length, 1);
  assert.equal(
    harness.sends[0].attachments[0].filename,
    buildSalesInvoicePdfFilename(invoice.invoiceNumber),
  );
  assert.match(harness.sends[0].subject, /ANX-2026-000042/);
  assert.match(harness.sends[0].text, /ANX-2026-000042/);
  assert.match(harness.sends[0].html, /ANX-2026-000042/);
});

test("C2 CASE 2: same invoice handler twice → one logical delivery", async () => {
  const invoice = buildIssuedFixture();
  const harness = createHarness();

  const first = await deliverIssuedSalesInvoiceEmail(invoice, harness.deps);
  const second = await deliverIssuedSalesInvoiceEmail(invoice, harness.deps);

  assert.equal(first.success, true);
  assert.equal(second.success, true);
  assert.equal(second.skipped, true);
  assert.equal(second.reason, "idempotent_skip");
  assert.equal(harness.sendCount, 1);
  assert.equal(harness.claimCount, 2);
});

test("C2 CASE 3: different renewal invoice → separate delivery allowed", async () => {
  const initial = buildIssuedFixture({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1" });
  const renewal = buildIssuedFixture({
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
    invoiceNumber: "ANX-2026-000043",
  });
  const harness = createHarness();

  const a = await deliverIssuedSalesInvoiceEmail(initial, harness.deps);
  const b = await deliverIssuedSalesInvoiceEmail(renewal, harness.deps);

  assert.equal(a.success, true);
  assert.equal(b.success, true);
  assert.equal(harness.sendCount, 2);
  assert.notEqual(
    buildSalesInvoiceIssuedTemplateKey(initial.id),
    buildSalesInvoiceIssuedTemplateKey(renewal.id),
  );
});

test("C2 CASE 4: PDF failure → no email send; failure recorded", async () => {
  const invoice = buildIssuedFixture();
  const harness = createHarness({ pdfFails: true });
  const result = await deliverIssuedSalesInvoiceEmail(invoice, harness.deps);

  assert.equal(result.success, false);
  assert.equal(result.reason, "pdf_failed");
  assert.equal(harness.sendCount, 0);
  assert.equal(harness.finalizations.at(-1)?.status, "failed");
  assert.equal(harness.finalizations.at(-1)?.errorCode, "pdf_generation_failed");
  assert.equal(invoice.status, "issued");
});

test("C2 CASE 5: email transport failure → invoice intact; failure path used", async () => {
  const invoice = buildIssuedFixture();
  const harness = createHarness({ sendFails: true });
  const result = await deliverIssuedSalesInvoiceEmail(invoice, harness.deps);

  assert.equal(result.success, false);
  assert.equal(result.reason, "send_failed");
  assert.equal(harness.sendCount, 1);
  assert.equal(invoice.status, "issued");
  assert.equal(invoice.invoiceNumber, "ANX-2026-000042");
});

test("C2 CASE 6: missing recipient → safe fail; no owner email fallback", async () => {
  const invoice = buildIssuedFixture({ buyerBillingEmail: null });
  const harness = createHarness({
    ledgerUser: { userId: "user-owner-1", email: "owner@example.com" },
  });
  const result = await deliverIssuedSalesInvoiceEmail(invoice, harness.deps);

  assert.equal(result.success, false);
  assert.equal(result.reason, "missing_recipient");
  assert.equal(harness.sendCount, 0);
  assert.equal(resolveIssuedInvoiceEmailRecipient(invoice), null);
  assert.equal(harness.finalizations.at(-1)?.status, "skipped");
  assert.equal(harness.finalizations.at(-1)?.errorCode, "missing_recipient");
  for (const send of harness.sends) {
    assert.notEqual(send.to, "owner@example.com");
  }
});

test("C2 CASE 7: attachment path uses production renderer (preview:false)", async () => {
  const invoice = buildIssuedFixture();
  const harness = createHarness();
  await deliverIssuedSalesInvoiceEmail(invoice, harness.deps);
  assert.equal(harness.pdfCalls.length, 1);
  assert.equal(harness.pdfCalls[0].preview, false);

  const realPdf = await generateSalesInvoicePdf(invoice, {
    preview: false,
    locale: "en",
    compress: false,
  });
  assert.ok(Buffer.isBuffer(realPdf));
  assert.ok(realPdf.length > 500);
  assert.equal(realPdf.subarray(0, 4).toString("latin1"), "%PDF");
});

test("C2 CASE 8: customer-visible email contains no intentional noreply", () => {
  const invoice = buildIssuedFixture();
  const input = {
    buyerLegalName: invoice.buyerLegalName,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDateLabel: "Aug 15, 2026",
    billingPeriodLabel: "Aug 1, 2026 – Aug 31, 2026",
    totalLabel: "€179.00",
    currency: "EUR",
  };
  const subject = buildSalesInvoiceIssuedSubject(input);
  const html = buildSalesInvoiceIssuedHtml(input);
  const text = buildSalesInvoiceIssuedPlainText(input);

  assert.doesNotMatch(subject, /noreply@/i);
  assert.doesNotMatch(html, /noreply@/i);
  assert.doesNotMatch(text, /noreply@/i);
  assert.doesNotMatch(html, /no-reply@/i);
  assert.doesNotMatch(text, /no-reply@/i);
  assert.match(html, /support@auroranexis\.com/);
  assert.match(text, /support@auroranexis\.com/);

  const emailSource = readSource("src/lib/billing/sales-invoice-email.ts");
  const templateSource = readSource("src/lib/email/templates/sales-invoice.ts");
  assert.doesNotMatch(templateSource, /noreply@auroranexis\.com/);
  assert.doesNotMatch(templateSource, /no-reply@/);
  assert.match(emailSource, /COMPANY_CONTACT\.supportEmail/);
  assert.match(emailSource, /preview:\s*false/);
});

test("C2 wiring: issueSalesInvoice triggers delivery after persist; PDF route unchanged", () => {
  const issue = readSource("src/lib/billing/sales-invoice.ts");
  const pdfRoute = readSource("src/app/api/billing/sales-invoices/[invoiceId]/pdf/route.ts");
  const pdfHelper = readSource("src/lib/billing/sales-invoice-pdf.ts");
  const email = readSource("src/lib/billing/sales-invoice-email.ts");

  assert.match(issue, /deliverIssuedSalesInvoiceEmail/);
  assert.match(issue, /invoice retained/);
  assert.match(email, /generateSalesInvoicePdf|generatePdf/);
  assert.match(readSource("src/lib/email/templates/sales-invoice.ts"), /sales_invoice:\$\{/);
  assert.match(pdfHelper, /preview:\s*false/);
  assert.match(pdfRoute, /generateIssuedSalesInvoicePdfForOrganization/);
  assert.doesNotMatch(email, /mollie.*invoic/i);
  assert.doesNotMatch(email, /issueSalesInvoice/);
});

test("C2 security: header sanitization and recipient snapshot only", () => {
  assert.equal(sanitizeEmailHeaderValue("ANX-1\r\nBcc: evil@x.com"), "ANX-1 Bcc: evil@x.com");
  assert.equal(
    resolveIssuedInvoiceEmailRecipient({ buyerBillingEmail: "billing@ok.example" }),
    "billing@ok.example",
  );
  assert.equal(resolveIssuedInvoiceEmailRecipient({ buyerBillingEmail: "not-an-email" }), null);
  assert.equal(resolveIssuedInvoiceEmailRecipient({ buyerBillingEmail: null }), null);
  assert.equal(
    buildSalesInvoiceIssuedTemplateKey("inv-1"),
    "sales_invoice:inv-1:issued",
  );
});
