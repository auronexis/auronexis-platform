/**
 * Auroranexis sales invoice presentation — HTML + PDF from stored domain records.
 * Consumes immutable invoice facts only (SalesInvoiceRecord), never live org fields.
 */

import "server-only";

import PDFDocument from "pdfkit";
import { COMPANY_CONTACT } from "@/lib/company/company-contact";
import {
  formatLegalContactLine,
  formatSupportContactLine,
  formatVatLine,
  LEGAL_UI_LABELS,
} from "@/lib/company/company-legal";
import type { SalesInvoiceRecord } from "@/lib/billing/sales-invoice";
import { toCustomerInvoiceView } from "@/lib/billing/sales-invoice";
import { formatMoneyFromCentsLocale } from "@/lib/i18n/format";
import { formatVatRateBpsLabel } from "@/lib/billing/taxes";

export type SalesInvoiceRenderOptions = {
  /** When true, adds non-production watermark and omits tax-document claims. */
  preview?: boolean;
  locale?: "en" | "de";
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMinor(amountMinor: number, currency: string, locale: "en" | "de"): string {
  return formatMoneyFromCentsLocale(amountMinor, currency, locale);
}

function formatDateIso(value: string | null | undefined, locale: "en" | "de"): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value));
}

function taxTreatmentLabel(outcome: SalesInvoiceRecord["taxPolicyOutcome"]): string {
  switch (outcome) {
    case "STANDARD_DOMESTIC_VAT":
      return "Standard domestic VAT";
    case "REVERSE_CHARGE":
      return "Reverse charge (EU B2B)";
    case "ZERO_RATE_IF_LEGALLY_APPLICABLE":
      return "Zero rate (if legally applicable)";
    case "TAX_EXEMPT_IF_LEGALLY_APPLICABLE":
      return "Tax exempt (if legally applicable)";
    case "MANUAL_REVIEW":
      return "Manual review required";
    case "UNKNOWN_BLOCK_CHECKOUT":
      return "Tax treatment blocked";
    default:
      return outcome;
  }
}

function invoiceDocumentStyles(): string {
  return `
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px;
      font-family: "Segoe UI", system-ui, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #111827;
      background: #f8fafc;
    }
    .sheet {
      max-width: 820px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 40px;
    }
    .banner-preview {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      color: #92400e;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      font-weight: 600;
    }
    .banner-warning {
      background: #fee2e2;
      border: 1px solid #ef4444;
      color: #991b1b;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    h1 { margin: 0 0 8px; font-size: 28px; }
    .meta { color: #64748b; margin-bottom: 32px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .block h2 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; }
    .block p { margin: 0; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    th { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
    .totals { margin-left: auto; width: min(360px, 100%); }
    .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
    .totals .grand { font-weight: 700; font-size: 16px; border-top: 2px solid #111827; margin-top: 8px; padding-top: 10px; }
    footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
    .tax-note { margin-top: 16px; font-size: 13px; color: #334155; }
  `;
}

export function renderSalesInvoiceHtml(
  invoice: SalesInvoiceRecord,
  options: SalesInvoiceRenderOptions = {},
): string {
  const locale = options.locale ?? "en";
  const view = toCustomerInvoiceView(invoice);
  const seller = invoice.sellerSnapshot;
  const missingSellerFields =
    seller?.configStatus === "OPERATOR_INPUT_REQUIRED"
      ? ["legalName", "vatId", "street", "postalCode", "city"].filter((field) => {
          if (field === "legalName") return !seller.legalName?.trim();
          if (field === "vatId") return !seller.vatId?.trim();
          if (field === "street") return !seller.addressLines[0]?.trim();
          if (field === "postalCode" || field === "city") {
            return seller.addressLines.length < 2;
          }
          return false;
        })
      : [];

  const sellerLines = seller?.addressLines ?? [];
  const buyerLines = [
    invoice.buyerLegalName,
    invoice.buyerCountryCode ? `Country: ${invoice.buyerCountryCode}` : null,
    invoice.buyerVatId ? `${LEGAL_UI_LABELS.vatId}: ${invoice.buyerVatId}` : null,
  ].filter(Boolean);

  const lineRows = invoice.lines
    .map(
      (line) => `
      <tr>
        <td>${escapeHtml(line.description)}</td>
        <td class="num">${line.quantity}</td>
        <td class="num">${escapeHtml(formatMinor(line.lineNetMinor, invoice.currency, locale))}</td>
        <td class="num">${escapeHtml(formatMinor(line.lineVatMinor, invoice.currency, locale))}</td>
        <td class="num">${escapeHtml(formatMinor(line.lineGrossMinor, invoice.currency, locale))}</td>
      </tr>`,
    )
    .join("");

  const previewBanner = options.preview
    ? `<div class="banner-preview">NON-PRODUCTION PREVIEW — Not a tax document. No financial records were created. Invoice number is ephemeral.</div>`
    : "";

  const sellerWarning =
    missingSellerFields.length > 0
      ? `<div class="banner-warning">Seller configuration incomplete — missing: ${escapeHtml(missingSellerFields.join(", "))}. Production invoice issuance is blocked until operator completes seller tax configuration.</div>`
      : seller?.configStatus === "OPERATOR_INPUT_REQUIRED"
        ? `<div class="banner-warning">Seller tax configuration status: OPERATOR_INPUT_REQUIRED — verify COMPANY_INFORMATION before live invoice issuance.</div>`
        : "";

  const reverseChargeNote =
    invoice.reverseChargeApplied && !view.taxNote
      ? `<p class="tax-note"><strong>Reverse charge:</strong> Applied per tax policy, but customer-facing legend is counsel-gated and not shown.</p>`
      : view.taxNote
        ? `<p class="tax-note"><strong>Tax note:</strong> ${escapeHtml(view.taxNote)}</p>`
        : "";

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
  <style>${invoiceDocumentStyles()}</style>
</head>
<body>
  <div class="sheet">
    ${previewBanner}
    ${sellerWarning}
    <h1>Invoice</h1>
    <p class="meta">
      ${escapeHtml(invoice.invoiceNumber)} · Issued ${escapeHtml(formatDateIso(invoice.issuedAt, locale))}
      ${invoice.billingPeriodStart && invoice.billingPeriodEnd
        ? ` · Period ${escapeHtml(formatDateIso(invoice.billingPeriodStart, locale))} – ${escapeHtml(formatDateIso(invoice.billingPeriodEnd, locale))}`
        : ""}
    </p>

    <div class="grid">
      <div class="block">
        <h2>Seller</h2>
        <p><strong>${escapeHtml(seller?.legalName ?? "—")}</strong></p>
        ${sellerLines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
        ${seller?.vatId ? `<p>${escapeHtml(formatVatLine())}</p>` : `<p>${LEGAL_UI_LABELS.vatId}: —</p>`}
        <p>Country: ${escapeHtml(seller?.countryCode ?? "—")}</p>
      </div>
      <div class="block">
        <h2>Buyer</h2>
        ${buyerLines.map((line) => `<p>${escapeHtml(String(line))}</p>`).join("")}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="num">Qty</th>
          <th class="num">Net</th>
          <th class="num">VAT</th>
          <th class="num">Gross</th>
        </tr>
      </thead>
      <tbody>${lineRows}</tbody>
    </table>

    <div class="totals">
      <div><span>Net total</span><span>${escapeHtml(formatMinor(view.netMinor, view.currency, locale))}</span></div>
      <div><span>${escapeHtml(view.vatRateLabel || formatVatRateBpsLabel(invoice.vatRateBps))}</span><span>${escapeHtml(formatMinor(view.vatMinor, view.currency, locale))}</span></div>
      <div class="grand"><span>Total (${escapeHtml(view.currency)})</span><span>${escapeHtml(formatMinor(view.grossMinor, view.currency, locale))}</span></div>
    </div>

    <p class="tax-note"><strong>Tax treatment:</strong> ${escapeHtml(taxTreatmentLabel(invoice.taxPolicyOutcome))}</p>
    ${invoice.businessClassification ? `<p class="tax-note"><strong>Business classification:</strong> ${escapeHtml(invoice.businessClassification)}</p>` : ""}
    ${reverseChargeNote}

    <p class="tax-note">
      <strong>Payment reference:</strong> ${escapeHtml(invoice.providerTransactionId ?? invoice.molliePaymentId ?? "—")}
    </p>

    <footer>
      <p>${escapeHtml(formatLegalContactLine())} · ${escapeHtml(formatSupportContactLine())}</p>
      <p>Auroranexis issues sales invoices distinct from Mollie payment receipts. Amounts in ${escapeHtml(invoice.currency)} (integer minor units internally).</p>
      ${options.preview ? "<p>This preview was generated in memory for operator verification only.</p>" : ""}
    </footer>
  </div>
</body>
</html>`;
}

type PdfDoc = InstanceType<typeof PDFDocument>;

function pdfLine(doc: PdfDoc, label: string, value: string, bold = false): void {
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(10).text(`${label}: ${value}`);
}

export async function generateSalesInvoicePdf(
  invoice: SalesInvoiceRecord,
  options: SalesInvoiceRenderOptions = {},
): Promise<Buffer> {
  const locale = options.locale ?? "en";
  const view = toCustomerInvoiceView(invoice);
  const seller = invoice.sellerSnapshot;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    if (options.preview) {
      doc.fontSize(10).fillColor("#92400e").text("NON-PRODUCTION PREVIEW — Not a tax document.", {
        align: "center",
      });
      doc.moveDown(0.5);
      doc.fillColor("#000000");
    }

    doc.fontSize(20).font("Helvetica-Bold").text("Invoice");
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica").text(`${invoice.invoiceNumber} · Issued ${formatDateIso(invoice.issuedAt, locale)}`);
    if (invoice.billingPeriodStart && invoice.billingPeriodEnd) {
      doc.text(
        `Period ${formatDateIso(invoice.billingPeriodStart, locale)} – ${formatDateIso(invoice.billingPeriodEnd, locale)}`,
      );
    }
    doc.moveDown(1);

    doc.fontSize(12).font("Helvetica-Bold").text("Seller");
    doc.fontSize(10).font("Helvetica");
    doc.text(seller?.legalName ?? "—");
    for (const line of seller?.addressLines ?? []) {
      doc.text(line);
    }
    doc.text(seller?.vatId ? formatVatLine() : `${LEGAL_UI_LABELS.vatId}: —`);
    doc.moveDown(0.8);

    doc.fontSize(12).font("Helvetica-Bold").text("Buyer");
    doc.fontSize(10).font("Helvetica");
    doc.text(invoice.buyerLegalName ?? "—");
    if (invoice.buyerCountryCode) doc.text(`Country: ${invoice.buyerCountryCode}`);
    if (invoice.buyerVatId) doc.text(`${LEGAL_UI_LABELS.vatId}: ${invoice.buyerVatId}`);
    doc.moveDown(1);

    for (const line of invoice.lines) {
      doc.font("Helvetica-Bold").text(line.description);
      doc.font("Helvetica").text(
        `Net ${formatMinor(line.lineNetMinor, invoice.currency, locale)} · VAT ${formatMinor(line.lineVatMinor, invoice.currency, locale)} · Gross ${formatMinor(line.lineGrossMinor, invoice.currency, locale)}`,
      );
      doc.moveDown(0.5);
    }

    doc.moveDown(0.5);
    pdfLine(doc, "Net total", formatMinor(view.netMinor, view.currency, locale));
    pdfLine(doc, view.vatRateLabel, formatMinor(view.vatMinor, view.currency, locale));
    pdfLine(doc, `Total (${view.currency})`, formatMinor(view.grossMinor, view.currency, locale), true);
    doc.moveDown(0.5);
    pdfLine(doc, "Tax treatment", taxTreatmentLabel(invoice.taxPolicyOutcome));
    if (view.taxNote) pdfLine(doc, "Tax note", view.taxNote);
    pdfLine(
      doc,
      "Payment reference",
      invoice.providerTransactionId ?? invoice.molliePaymentId ?? "—",
    );
    doc.moveDown(1);

    doc.fontSize(9).fillColor("#64748b");
    doc.text(`${formatLegalContactLine()} · ${formatSupportContactLine()}`);
    doc.text(`${COMPANY_CONTACT.noReplyEmail}`);
    if (options.preview) {
      doc.text("Ephemeral operator preview — no database record created.");
    }
    doc.fillColor("#000000");

    doc.end();
  });
}

export function buildSalesInvoicePdfFilename(invoiceNumber: string): string {
  const slug = invoiceNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `auroranexis-invoice-${slug || "preview"}.pdf`;
}
