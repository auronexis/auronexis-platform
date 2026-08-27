/**
 * Phase C1.5 — Operator production-renderer visual acceptance PDF.
 *
 * Behavioral coverage (not regex-only):
 * - operator can build Business test model + valid PDF via production renderer
 * - unauthorized roles lack settings.write
 * - TEST indicator present on preview; absent on production customer PDF
 * - no issueSalesInvoice / allocate / Mollie / DB write on preview path
 * - production download endpoint stays preview:false
 * - synthetic invoice never enters Billing history source path
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/operator-invoice-visual-acceptance-c1-5.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const preview = await import("../src/lib/billing/sales-invoice-preview.ts");
const render = await import("../src/lib/billing/sales-invoice-render.ts");
const plans = await import("../src/lib/billing/plans.ts");
const taxes = await import("../src/lib/billing/taxes.ts");
const taxPolicy = await import("../src/lib/billing/tax-policy.ts");

const {
  buildPreviewSalesInvoice,
  OPERATOR_VISUAL_ACCEPTANCE_INVOICE_NUMBER,
  OPERATOR_VISUAL_ACCEPTANCE_BUYER,
  OPERATOR_TEST_DOCUMENT_INDICATOR,
  PREVIEW_ORGANIZATION_ID,
  PREVIEW_PAYMENT_REFERENCE,
} = preview;

const { generateSalesInvoicePdf, renderSalesInvoiceHtml } = render;
const { getPlanByKey } = plans;
const { calculateVatInclusiveBreakdown } = taxes;
const { determineTaxPolicy } = taxPolicy;

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

/** Mirrors production gate: canManageOrganizationSettings → settings.write (owner/admin only). */
function operatorInvoiceTestAuthorized(role) {
  return role === "owner" || role === "admin";
}

test("C1.5: Business visual-acceptance model uses catalog price + DE domestic VAT helpers", () => {
  const business = getPlanByKey("business");
  assert.equal(business.currency, "EUR");
  assert.equal(business.amountMinor, 59_900);

  const determination = determineTaxPolicy({
    customerCountryCode: OPERATOR_VISUAL_ACCEPTANCE_BUYER.countryCode,
    vatId: OPERATOR_VISUAL_ACCEPTANCE_BUYER.vatId,
    viesStatus: "not_checked",
    isB2bEntrepreneurConfirmed: true,
  });
  assert.equal(determination.outcome, "STANDARD_DOMESTIC_VAT");
  assert.equal(determination.vatRateBps, 1900);

  const expected = calculateVatInclusiveBreakdown({
    grossMinor: business.amountMinor,
    determination,
  });

  const { invoice } = buildPreviewSalesInvoice("business");
  assert.equal(invoice.invoiceNumber, OPERATOR_VISUAL_ACCEPTANCE_INVOICE_NUMBER);
  assert.equal(invoice.invoiceNumber, "TEST-ANX-2026-000001");
  assert.equal(invoice.buyerLegalName, "Auroranexis Invoice Test GmbH");
  assert.equal(invoice.buyerAddressLine1, "Musterstraße 10");
  assert.equal(invoice.buyerPostalCode, "68159");
  assert.equal(invoice.buyerCity, "Mannheim");
  assert.equal(invoice.buyerCountryCode, "DE");
  assert.equal(invoice.buyerVatId, "DE123456789");
  assert.equal(invoice.currency, "EUR");
  assert.equal(invoice.grossMinor, expected.grossMinor);
  assert.equal(invoice.netMinor, expected.netMinor);
  assert.equal(invoice.vatMinor, expected.vatMinor);
  assert.equal(invoice.vatRateBps, expected.vatRateBps);
  assert.equal(invoice.taxPolicyOutcome, "STANDARD_DOMESTIC_VAT");
  assert.equal(invoice.organizationId, PREVIEW_ORGANIZATION_ID);
  assert.equal(invoice.molliePaymentId, PREVIEW_PAYMENT_REFERENCE);
  assert.equal(invoice.grossMinor, 59_900);
  assert.equal(invoice.netMinor, 50_336);
  assert.equal(invoice.vatMinor, 9_564);
  assert.equal(
    invoice.lines[0].description,
    "Auroranexis Business — Monthly SaaS subscription",
  );
  assert.doesNotMatch(invoice.lines[0].description, /eur-v1/);
  assert.equal(invoice.taxNote, "German VAT (19%)");
  assert.equal(invoice.buyerBillingEmail, OPERATOR_VISUAL_ACCEPTANCE_BUYER.billingEmail);
});

test("C1.5: operator can generate valid PDF via production generateSalesInvoicePdf", async () => {
  const { invoice } = buildPreviewSalesInvoice("business");
  const pdf = await generateSalesInvoicePdf(invoice, {
    preview: true,
    locale: "en",
    compress: false,
  });

  assert.ok(Buffer.isBuffer(pdf) || pdf instanceof Uint8Array);
  assert.ok(pdf.byteLength > 200);
  assert.equal(Buffer.from(pdf).subarray(0, 5).toString("utf8"), "%PDF-");

  const text = extractPdfText(pdf);
  assert.match(text, /TEST-ANX-2026-000001/);
  assert.match(text, /Auroranexis Invoice Test GmbH/);
  assert.match(text, /Musterstra/);
  assert.match(text, /68159/);
  assert.match(text, /Mannheim/);
  assert.match(text, /DE123456789/);
  assert.match(text, /TEST DOCUMENT/);
  assert.match(text, /NOT AN INVOICE/);
  assert.equal(OPERATOR_TEST_DOCUMENT_INDICATOR, "TEST DOCUMENT — NOT AN INVOICE");

  const html = renderSalesInvoiceHtml(invoice, { preview: true, locale: "en" });
  assert.match(html, /TEST DOCUMENT — NOT AN INVOICE/);
  assert.match(html, /TEST-ANX-2026-000001/);
});

test("C1.5: same production renderer; customer PDF has no TEST indicator", async () => {
  const { invoice: testInvoice } = buildPreviewSalesInvoice("business");
  const productionLike = {
    ...testInvoice,
    id: "11111111-1111-4111-8111-111111111111",
    organizationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    invoiceNumber: "ANX-2026-000042",
    molliePaymentId: "tr_live_fixture",
    providerTransactionId: "tr_live_fixture",
  };

  const testPdf = await generateSalesInvoicePdf(testInvoice, {
    preview: true,
    locale: "en",
    compress: false,
  });
  const prodPdf = await generateSalesInvoicePdf(productionLike, {
    preview: false,
    locale: "en",
    compress: false,
  });

  const testText = extractPdfText(testPdf);
  const prodText = extractPdfText(prodPdf);

  assert.match(testText, /TEST DOCUMENT/);
  assert.doesNotMatch(prodText, /TEST DOCUMENT/);
  assert.doesNotMatch(prodText, /NOT AN INVOICE/);
  assert.match(prodText, /ANX-2026-000042/);
  assert.match(prodText, /Invoice/);
});

test("C1.5: owner/admin authorized; staff/viewer unauthorized", () => {
  assert.equal(operatorInvoiceTestAuthorized("owner"), true);
  assert.equal(operatorInvoiceTestAuthorized("admin"), true);
  assert.equal(operatorInvoiceTestAuthorized("staff"), false);
  assert.equal(operatorInvoiceTestAuthorized("viewer"), false);

  const route = readSource("src/app/api/operator/sales-invoice/preview/route.ts");
  const guards = readSource("src/lib/team/guards.ts");
  const authz = readSource("src/lib/authorization/permissions.ts");
  assert.match(route, /canManageOrganizationSettings/);
  assert.match(route, /getSession/);
  assert.match(route, /status:\s*401/);
  assert.match(route, /Unauthorized/);
  assert.match(guards, /canManageOrganizationSettings[\s\S]*settings\.write/);
  assert.match(authz, /owner:\s*ALL_PERMISSIONS/);
  assert.match(authz, /admin:\s*ALL_PERMISSIONS/);
  assert.match(authz, /staff:\s*"analyst"/);
  assert.match(authz, /viewer:\s*"readonly"/);
  // analyst / readonly matrices must not list settings.write
  const analystBlock = authz.slice(authz.indexOf("analyst:"), authz.indexOf("member:"));
  const readonlyBlock = authz.slice(authz.indexOf("readonly:"), authz.indexOf("];", authz.indexOf("readonly:")) + 2);
  assert.doesNotMatch(analystBlock, /settings\.write/);
  assert.doesNotMatch(readonlyBlock, /settings\.write/);
});

test("C1.5: operator preview route uses production renderer and auth; no mutation APIs", () => {
  const route = readSource("src/app/api/operator/sales-invoice/preview/route.ts");
  assert.match(route, /generateSalesInvoicePdf/);
  assert.match(route, /buildPreviewSalesInvoice/);
  assert.match(route, /preview:\s*true/);
  assert.match(route, /getSession/);
  assert.match(route, /canManageOrganizationSettings/);
  assert.match(route, /status:\s*401/);
  assert.match(route, /Unauthorized/);
  assert.doesNotMatch(route, /issueSalesInvoice/);
  assert.doesNotMatch(route, /allocateInvoiceNumber/);
  assert.doesNotMatch(route, /\.from\(["']sales_invoices["']\)/);
  assert.doesNotMatch(route, /createMollie|mollie\.payments|mollieClient/i);
  assert.doesNotMatch(route, /insert\(|update\(|upsert\(/);

  const previewModule = readSource("src/lib/billing/sales-invoice-preview.ts");
  assert.doesNotMatch(previewModule, /issueSalesInvoice/);
  assert.doesNotMatch(previewModule, /allocateInvoiceNumber/);
  assert.doesNotMatch(previewModule, /createClient|createAdminClient|\.from\(/);
  assert.doesNotMatch(previewModule, /from\(["']@\/lib\/billing\/providers\/mollie/);
  assert.doesNotMatch(previewModule, /createMollie|mollie\.payments|getMollieClient/i);
  assert.match(previewModule, /Never persists|never allocates|never calls Mollie/i);
});

test("C1.5: production customer PDF endpoint unchanged (preview:false, no TEST path)", () => {
  const prodRoute = readSource("src/app/api/billing/sales-invoices/[invoiceId]/pdf/route.ts");
  const pdfHelper = readSource("src/lib/billing/sales-invoice-pdf.ts");
  assert.match(prodRoute, /generateIssuedSalesInvoicePdfForOrganization/);
  assert.match(prodRoute, /getSession/);
  assert.match(prodRoute, /canManageOrganizationSettings/);
  assert.doesNotMatch(prodRoute, /preview:\s*true/);
  assert.doesNotMatch(prodRoute, /buildPreviewSalesInvoice/);
  assert.doesNotMatch(prodRoute, /TEST DOCUMENT/);
  assert.match(pdfHelper, /preview:\s*false/);
  assert.doesNotMatch(pdfHelper, /issueSalesInvoice/);
  assert.match(pdfHelper, /Read-only|never issues/i);
});

test("C1.5: Billing history remains DB-backed; preview synthetic id not in history source", () => {
  const history = readSource("src/lib/billing/transactions.ts");
  assert.match(history, /billing_provider_transactions/);
  assert.match(history, /listSalesInvoiceIdsByProviderTransactionIds/);
  assert.doesNotMatch(history, /buildPreviewSalesInvoice/);
  assert.doesNotMatch(history, /PREVIEW_ORGANIZATION_ID|000000PREVIEW/);
  assert.doesNotMatch(history, /TEST-ANX-2026-000001/);

  const { invoice } = buildPreviewSalesInvoice("business");
  assert.equal(invoice.organizationId, PREVIEW_ORGANIZATION_ID);
  assert.notEqual(invoice.organizationId.length, 0);
  assert.match(invoice.id, /preview-ephemeral/);
});

test("C1.5: live charging remains fail-closed", async () => {
  const rollout = await import("../src/lib/billing/providers/mollie/rollout.ts");
  assert.equal(rollout.isMollieLiveChargingEnabled(), false);
});
