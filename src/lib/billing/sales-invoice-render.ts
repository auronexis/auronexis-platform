/**
 * Auroranexis sales invoice presentation — HTML + PDF from stored domain records.
 * Consumes immutable invoice facts only (SalesInvoiceRecord), never live org fields.
 * Shared renderer for production (preview: false) and operator visual acceptance (preview: true).
 */

import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { COMPANY_CONTACT } from "@/lib/company/company-contact";
import { COMPANY_INFORMATION } from "@/lib/company/company-information";
import { LEGAL_UI_LABELS } from "@/lib/company/company-legal";
import type { SalesInvoiceRecord } from "@/lib/billing/sales-invoice";
import {
  getBuyerSnapshotFromInvoice,
  toCustomerInvoiceView,
} from "@/lib/billing/sales-invoice";
import { formatBuyerInvoiceAddressLines } from "@/lib/billing/buyer-invoice-snapshot";
import { toCustomerVisibleInvoiceLineDescription } from "@/lib/billing/sales-invoice-customer-copy";
import { reverseChargeLegendTextForLocale } from "@/lib/billing/reverse-charge-legend";
import { formatMoneyFromCentsLocale } from "@/lib/i18n/format";
import { formatVatRateBpsLabel } from "@/lib/billing/taxes";
import { OPERATOR_TEST_DOCUMENT_INDICATOR } from "@/lib/billing/sales-invoice-test-marker";

export { OPERATOR_TEST_DOCUMENT_INDICATOR };

export type SalesInvoiceRenderOptions = {
  /** When true, adds TEST DOCUMENT overlay; production customer PDFs must use preview: false. */
  preview?: boolean;
  locale?: "en" | "de";
  /**
   * PDF stream compression. Default true. Tests may set false to assert embedded text
   * without inflating FlateDecode streams.
   */
  compress?: boolean;
};

/** Prefer locale-aware RC legend when reverse charge tax note is already customer-visible. */
function displayedInvoiceTaxNote(
  invoice: SalesInvoiceRecord,
  taxNote: string | null,
  locale: "en" | "de",
): string | null {
  if (invoice.reverseChargeApplied && taxNote) {
    return reverseChargeLegendTextForLocale(locale);
  }
  return taxNote;
}

/** Canonical horizontal wordmark for white / light surfaces (login + BrandLogo dark variant). */
export const INVOICE_PDF_LOGO_PUBLIC_PATH = BRANDING_ASSETS.logoHorizontalOnLight;

const INVOICE_COLORS = {
  ink: "#0a1628",
  muted: "#475569",
  rule: "#e2e8f0",
  accent: "#2563eb",
  surface: "#ffffff",
  previewBg: "#fffbeb",
  previewBorder: "#f59e0b",
  previewText: "#92400e",
  tableHead: "#f8fafc",
} as const;

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

function paymentReference(invoice: SalesInvoiceRecord): string {
  return invoice.providerTransactionId ?? invoice.molliePaymentId ?? "—";
}

/** Invoice footer contacts — support + sales + website only (never noreply / legal@). */
function formatInvoiceCustomerFooterLine(): string {
  const website = COMPANY_INFORMATION.website.replace(/^https?:\/\//, "");
  return `${website} · Support: ${COMPANY_CONTACT.supportEmail} · Sales: ${COMPANY_CONTACT.salesEmail}`;
}

function billingPeriodLabel(
  invoice: SalesInvoiceRecord,
  locale: "en" | "de",
): string | null {
  if (!invoice.billingPeriodStart || !invoice.billingPeriodEnd) return null;
  return `${formatDateIso(invoice.billingPeriodStart, locale)} – ${formatDateIso(invoice.billingPeriodEnd, locale)}`;
}

function resolveInvoiceLogoAbsolutePath(): string {
  const relative = INVOICE_PDF_LOGO_PUBLIC_PATH.replace(/^\//, "");
  return path.join(process.cwd(), "public", relative);
}

/**
 * Load canonical on-light wordmark for local PDF embed.
 * Downscales only for PDF size/compatibility — same asset, no redraw.
 */
export async function loadInvoicePdfLogoBuffer(): Promise<Buffer> {
  const absolute = resolveInvoiceLogoAbsolutePath();
  const source = await fs.readFile(absolute);
  return sharp(source)
    .resize({ width: 480, withoutEnlargement: true })
    .png()
    .toBuffer();
}

function invoiceDocumentStyles(): string {
  return `
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: "Segoe UI", system-ui, sans-serif;
      font-size: 13px;
      line-height: 1.45;
      color: ${INVOICE_COLORS.ink};
      background: ${INVOICE_COLORS.surface};
    }
    .sheet {
      max-width: 800px;
      margin: 0 auto;
      background: ${INVOICE_COLORS.surface};
      padding: 8px 8px 24px;
    }
    .banner-preview {
      background: ${INVOICE_COLORS.previewBg};
      border: 1px solid ${INVOICE_COLORS.previewBorder};
      color: ${INVOICE_COLORS.previewText};
      padding: 10px 14px;
      margin-bottom: 20px;
      font-weight: 600;
      font-size: 12px;
      letter-spacing: 0.02em;
    }
    .banner-warning {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      color: #991b1b;
      padding: 10px 14px;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid ${INVOICE_COLORS.ink};
      margin-bottom: 24px;
    }
    .header-logo img {
      display: block;
      height: 40px;
      width: auto;
      max-width: 220px;
      object-fit: contain;
    }
    .header-title {
      text-align: right;
    }
    .header-title h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: ${INVOICE_COLORS.ink};
    }
    .header-title .invoice-number {
      margin-top: 6px;
      font-size: 13px;
      font-weight: 600;
      color: ${INVOICE_COLORS.accent};
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px;
      margin-bottom: 22px;
    }
    .block h2 {
      margin: 0 0 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: ${INVOICE_COLORS.muted};
      font-weight: 600;
    }
    .block p { margin: 0 0 2px; }
    .block strong { font-weight: 650; }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px 20px;
      padding: 14px 16px;
      margin-bottom: 22px;
      background: ${INVOICE_COLORS.tableHead};
      border: 1px solid ${INVOICE_COLORS.rule};
    }
    .meta-grid dt {
      margin: 0;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: ${INVOICE_COLORS.muted};
    }
    .meta-grid dd {
      margin: 2px 0 0;
      font-size: 13px;
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0 0 8px;
    }
    th, td {
      padding: 10px 10px;
      border-bottom: 1px solid ${INVOICE_COLORS.rule};
      text-align: left;
      vertical-align: top;
    }
    th {
      background: ${INVOICE_COLORS.tableHead};
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: ${INVOICE_COLORS.muted};
      font-weight: 600;
    }
    td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
    .totals {
      margin: 16px 0 0 auto;
      width: min(320px, 100%);
    }
    .totals div {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 5px 0;
      color: ${INVOICE_COLORS.muted};
    }
    .totals .grand {
      margin-top: 8px;
      padding-top: 10px;
      border-top: 2px solid ${INVOICE_COLORS.ink};
      color: ${INVOICE_COLORS.ink};
      font-weight: 700;
      font-size: 15px;
    }
    .tax-note {
      margin-top: 18px;
      font-size: 12px;
      color: ${INVOICE_COLORS.muted};
    }
    footer {
      margin-top: 36px;
      padding-top: 14px;
      border-top: 1px solid ${INVOICE_COLORS.rule};
      color: ${INVOICE_COLORS.muted};
      font-size: 11px;
    }
    footer p { margin: 0 0 4px; }
    @media print {
      body { padding: 0; }
      .sheet { max-width: none; }
    }
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
  const buyer = getBuyerSnapshotFromInvoice(invoice);
  const buyerAddressLines = formatBuyerInvoiceAddressLines(buyer);
  const buyerLines = [
    buyer.legalName,
    ...buyerAddressLines,
    buyer.countryCode ? `Country: ${buyer.countryCode}` : null,
    buyer.vatId ? `${LEGAL_UI_LABELS.vatId}: ${buyer.vatId}` : null,
  ].filter(Boolean);

  const period = billingPeriodLabel(invoice, locale);
  const lineRows = invoice.lines
    .map(
      (line) => `
      <tr>
        <td>${escapeHtml(toCustomerVisibleInvoiceLineDescription(line.description))}</td>
        <td class="num">${line.quantity}</td>
        <td class="num">${escapeHtml(formatMinor(line.lineNetMinor, invoice.currency, locale))}</td>
        <td class="num">${escapeHtml(formatMinor(line.lineVatMinor, invoice.currency, locale))}</td>
        <td class="num">${escapeHtml(formatMinor(line.lineGrossMinor, invoice.currency, locale))}</td>
      </tr>`,
    )
    .join("");

  const previewBanner = options.preview
    ? `<div class="banner-preview">${OPERATOR_TEST_DOCUMENT_INDICATOR} — Operator visual acceptance only. No financial records were created. Invoice number is ephemeral.</div>`
    : "";

  const sellerWarning =
    missingSellerFields.length > 0
      ? `<div class="banner-warning">Seller configuration incomplete — missing: ${escapeHtml(missingSellerFields.join(", "))}. Production invoice issuance is blocked until operator completes seller tax configuration.</div>`
      : seller?.configStatus === "OPERATOR_INPUT_REQUIRED"
        ? `<div class="banner-warning">Seller tax configuration status: OPERATOR_INPUT_REQUIRED — verify COMPANY_INFORMATION before live invoice issuance.</div>`
        : "";

  const customerTaxNote = displayedInvoiceTaxNote(invoice, view.taxNote, locale);
  const reverseChargeNote =
    invoice.reverseChargeApplied && !view.taxNote
      ? `<p class="tax-note"><strong>Reverse charge:</strong> Applied per tax policy, but customer-facing legend is counsel-gated and not shown.</p>`
      : customerTaxNote
        ? `<p class="tax-note"><strong>Tax note:</strong> ${escapeHtml(customerTaxNote)}</p>`
        : "";

  const logoMarkup = `<div class="header-logo"><img src="${escapeHtml(INVOICE_PDF_LOGO_PUBLIC_PATH)}" alt="${escapeHtml(COMPANY_INFORMATION.productName)}" width="220" height="40" /></div>`;

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
    <header class="header">
      ${logoMarkup}
      <div class="header-title">
        <h1>INVOICE</h1>
        <p class="invoice-number">${escapeHtml(invoice.invoiceNumber)}</p>
      </div>
    </header>

    <div class="grid">
      <div class="block">
        <h2>Seller</h2>
        <p><strong>${escapeHtml(seller?.legalName ?? "—")}</strong></p>
        ${sellerLines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
        ${seller?.vatId ? `<p>${escapeHtml(`${LEGAL_UI_LABELS.vatId}: ${seller.vatId}`)}</p>` : `<p>${LEGAL_UI_LABELS.vatId}: —</p>`}
        <p>Country: ${escapeHtml(seller?.countryCode ?? "—")}</p>
      </div>
      <div class="block">
        <h2>Buyer</h2>
        ${buyerLines.map((line) => `<p>${escapeHtml(String(line))}</p>`).join("")}
      </div>
    </div>

    <dl class="meta-grid">
      <div>
        <dt>Invoice number</dt>
        <dd>${escapeHtml(invoice.invoiceNumber)}</dd>
      </div>
      <div>
        <dt>Invoice date</dt>
        <dd>${escapeHtml(formatDateIso(invoice.issuedAt, locale))}</dd>
      </div>
      <div>
        <dt>Billing period</dt>
        <dd>${escapeHtml(period ?? "—")}</dd>
      </div>
      <div>
        <dt>Currency</dt>
        <dd>${escapeHtml(invoice.currency)}</dd>
      </div>
      <div>
        <dt>Payment reference</dt>
        <dd>${escapeHtml(paymentReference(invoice))}</dd>
      </div>
    </dl>

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

    ${reverseChargeNote}

    <footer>
      <p>${escapeHtml(formatInvoiceCustomerFooterLine())}</p>
      <p>Auroranexis sales invoices are distinct from Mollie payment receipts.</p>
      ${options.preview ? "<p>This TEST DOCUMENT was generated in memory for operator visual acceptance only.</p>" : ""}
    </footer>
  </div>
</body>
</html>`;
}

type PdfDoc = InstanceType<typeof PDFDocument>;

function drawHorizontalRule(doc: PdfDoc, y: number, color: string, width = 1): void {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  doc
    .save()
    .strokeColor(color)
    .lineWidth(width)
    .moveTo(left, y)
    .lineTo(right, y)
    .stroke()
    .restore();
}

export async function generateSalesInvoicePdf(
  invoice: SalesInvoiceRecord,
  options: SalesInvoiceRenderOptions = {},
): Promise<Buffer> {
  const locale = options.locale ?? "en";
  const view = toCustomerInvoiceView(invoice);
  const seller = invoice.sellerSnapshot;
  const buyer = getBuyerSnapshotFromInvoice(invoice);
  const period = billingPeriodLabel(invoice, locale);
  const logoBuffer = await loadInvoicePdfLogoBuffer();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 48,
      size: "A4",
      compress: options.compress !== false,
      info: {
        Title: `Invoice ${invoice.invoiceNumber}`,
        Author: COMPANY_INFORMATION.legalName,
        Subject: options.preview
          ? OPERATOR_TEST_DOCUMENT_INDICATOR
          : `Sales invoice ${invoice.invoiceNumber}`,
        Creator: COMPANY_INFORMATION.productName,
      },
    });
    const chunks: Buffer[] = [];
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    let y = doc.page.margins.top;

    if (options.preview) {
      doc
        .save()
        .rect(left, y, pageWidth, 28)
        .fill(INVOICE_COLORS.previewBg)
        .strokeColor(INVOICE_COLORS.previewBorder)
        .lineWidth(1)
        .stroke()
        .restore();
      doc
        .fillColor(INVOICE_COLORS.previewText)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(OPERATOR_TEST_DOCUMENT_INDICATOR, left + 10, y + 9, {
          width: pageWidth - 20,
          align: "center",
        });
      y += 40;
      doc.fillColor(INVOICE_COLORS.ink);
    }

    const logoHeight = 36;
    const logoWidth = 140;
    doc.image(logoBuffer, left, y, { width: logoWidth, height: logoHeight, fit: [logoWidth, logoHeight] });

    doc
      .fillColor(INVOICE_COLORS.ink)
      .font("Helvetica-Bold")
      .fontSize(22)
      .text("INVOICE", left, y + 2, { width: pageWidth, align: "right" });
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(INVOICE_COLORS.accent)
      .text(invoice.invoiceNumber, left, y + 28, { width: pageWidth, align: "right" });

    y += Math.max(logoHeight, 48) + 14;
    drawHorizontalRule(doc, y, INVOICE_COLORS.ink, 1.5);
    y += 18;

    const colWidth = (pageWidth - 24) / 2;
    const sellerX = left;
    const buyerX = left + colWidth + 24;
    const partiesTop = y;

    doc.fillColor(INVOICE_COLORS.muted).font("Helvetica-Bold").fontSize(9).text("SELLER", sellerX, y);
    doc.fillColor(INVOICE_COLORS.muted).font("Helvetica-Bold").fontSize(9).text("BUYER", buyerX, y);
    y += 14;

    doc.fillColor(INVOICE_COLORS.ink).font("Helvetica-Bold").fontSize(10);
    doc.text(seller?.legalName ?? "—", sellerX, y, { width: colWidth });
    let sellerY = doc.y + 2;
    doc.font("Helvetica").fontSize(9).fillColor(INVOICE_COLORS.ink);
    for (const line of seller?.addressLines ?? []) {
      doc.text(line, sellerX, sellerY, { width: colWidth });
      sellerY = doc.y;
    }
    doc.text(
      seller?.vatId ? `${LEGAL_UI_LABELS.vatId}: ${seller.vatId}` : `${LEGAL_UI_LABELS.vatId}: —`,
      sellerX,
      sellerY,
      { width: colWidth },
    );
    sellerY = doc.y;
    if (seller?.countryCode) {
      doc.text(`Country: ${seller.countryCode}`, sellerX, sellerY, { width: colWidth });
      sellerY = doc.y;
    }

    let buyerY = partiesTop + 14;
    doc.fillColor(INVOICE_COLORS.ink).font("Helvetica-Bold").fontSize(10);
    doc.text(buyer.legalName ?? "—", buyerX, buyerY, { width: colWidth });
    buyerY = doc.y + 2;
    doc.font("Helvetica").fontSize(9);
    for (const line of formatBuyerInvoiceAddressLines(buyer)) {
      doc.text(line, buyerX, buyerY, { width: colWidth });
      buyerY = doc.y;
    }
    if (buyer.countryCode) {
      doc.text(`Country: ${buyer.countryCode}`, buyerX, buyerY, { width: colWidth });
      buyerY = doc.y;
    }
    if (buyer.vatId) {
      doc.text(`${LEGAL_UI_LABELS.vatId}: ${buyer.vatId}`, buyerX, buyerY, { width: colWidth });
      buyerY = doc.y;
    }

    y = Math.max(sellerY, buyerY) + 18;

    const metaRows: Array<[string, string]> = [
      ["Invoice number", invoice.invoiceNumber],
      ["Invoice date", formatDateIso(invoice.issuedAt, locale)],
      ["Billing period", period ?? "—"],
      ["Currency", invoice.currency],
      ["Payment reference", paymentReference(invoice)],
    ];

    const metaBoxHeight = 12 + metaRows.length * 16;
    doc
      .save()
      .rect(left, y, pageWidth, metaBoxHeight)
      .fill(INVOICE_COLORS.tableHead)
      .strokeColor(INVOICE_COLORS.rule)
      .lineWidth(0.75)
      .stroke()
      .restore();

    let metaY = y + 8;
    for (const [label, value] of metaRows) {
      doc
        .fillColor(INVOICE_COLORS.muted)
        .font("Helvetica")
        .fontSize(8)
        .text(label.toUpperCase(), left + 10, metaY, { width: 130, continued: false });
      doc
        .fillColor(INVOICE_COLORS.ink)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(value, left + 150, metaY - 1, { width: pageWidth - 170 });
      metaY += 16;
    }
    y += metaBoxHeight + 18;

    const columns = [
      { label: "Description", x: left, width: pageWidth * 0.42, align: "left" as const },
      { label: "Qty", x: left + pageWidth * 0.42, width: pageWidth * 0.1, align: "right" as const },
      { label: "Net", x: left + pageWidth * 0.52, width: pageWidth * 0.16, align: "right" as const },
      { label: "VAT", x: left + pageWidth * 0.68, width: pageWidth * 0.16, align: "right" as const },
      { label: "Gross", x: left + pageWidth * 0.84, width: pageWidth * 0.16, align: "right" as const },
    ];

    doc.save().rect(left, y, pageWidth, 22).fill(INVOICE_COLORS.tableHead).restore();
    doc.fillColor(INVOICE_COLORS.muted).font("Helvetica-Bold").fontSize(8);
    for (const col of columns) {
      doc.text(col.label.toUpperCase(), col.x, y + 7, { width: col.width, align: col.align });
    }
    y += 24;
    drawHorizontalRule(doc, y, INVOICE_COLORS.rule, 0.75);
    y += 8;

    for (const line of invoice.lines) {
      const rowTop = y;
      const lineDescription = toCustomerVisibleInvoiceLineDescription(line.description);
      doc.fillColor(INVOICE_COLORS.ink).font("Helvetica").fontSize(9);
      doc.text(lineDescription, columns[0].x, rowTop, {
        width: columns[0].width,
        align: "left",
      });
      const descBottom = doc.y;
      doc.text(String(line.quantity), columns[1].x, rowTop, {
        width: columns[1].width,
        align: "right",
      });
      doc.text(formatMinor(line.lineNetMinor, invoice.currency, locale), columns[2].x, rowTop, {
        width: columns[2].width,
        align: "right",
      });
      doc.text(formatMinor(line.lineVatMinor, invoice.currency, locale), columns[3].x, rowTop, {
        width: columns[3].width,
        align: "right",
      });
      doc.text(formatMinor(line.lineGrossMinor, invoice.currency, locale), columns[4].x, rowTop, {
        width: columns[4].width,
        align: "right",
      });
      y = Math.max(descBottom, rowTop + 14) + 8;
      drawHorizontalRule(doc, y, INVOICE_COLORS.rule, 0.5);
      y += 8;
    }

    y += 6;
    const totalsWidth = 220;
    const totalsX = right - totalsWidth;
    const vatLabel = view.vatRateLabel || formatVatRateBpsLabel(invoice.vatRateBps);
    const totals: Array<{ label: string; value: string; bold?: boolean }> = [
      { label: "Net total", value: formatMinor(view.netMinor, view.currency, locale) },
      { label: vatLabel, value: formatMinor(view.vatMinor, view.currency, locale) },
      {
        label: `Total (${view.currency})`,
        value: formatMinor(view.grossMinor, view.currency, locale),
        bold: true,
      },
    ];

    for (const row of totals) {
      if (row.bold) {
        drawHorizontalRule(doc, y, INVOICE_COLORS.ink, 1.25);
        y += 8;
        doc.font("Helvetica-Bold").fontSize(11).fillColor(INVOICE_COLORS.ink);
      } else {
        doc.font("Helvetica").fontSize(9).fillColor(INVOICE_COLORS.muted);
      }
      doc.text(row.label, totalsX, y, { width: totalsWidth * 0.55, align: "left" });
      doc.fillColor(INVOICE_COLORS.ink).text(row.value, totalsX + totalsWidth * 0.45, y, {
        width: totalsWidth * 0.55,
        align: "right",
      });
      y += row.bold ? 18 : 15;
    }

    const pdfTaxNote = displayedInvoiceTaxNote(invoice, view.taxNote, locale);
    if (pdfTaxNote) {
      y += 10;
      doc
        .fillColor(INVOICE_COLORS.muted)
        .font("Helvetica")
        .fontSize(9)
        .text(`Tax note: ${pdfTaxNote}`, left, y, { width: pageWidth });
      y = doc.y + 4;
    }

    const footerY = Math.max(y + 28, doc.page.height - doc.page.margins.bottom - 48);
    drawHorizontalRule(doc, footerY, INVOICE_COLORS.rule, 0.75);
    doc
      .fillColor(INVOICE_COLORS.muted)
      .font("Helvetica")
      .fontSize(8)
      .text(formatInvoiceCustomerFooterLine(), left, footerY + 10, {
        width: pageWidth,
        align: "left",
      });
    doc.text(
      "Auroranexis sales invoices are distinct from Mollie payment receipts.",
      left,
      doc.y + 2,
      { width: pageWidth },
    );
    if (options.preview) {
      doc.text("Ephemeral operator test — no database record created.", left, doc.y + 2, {
        width: pageWidth,
      });
    }

    doc.end();
  });
}

export function buildSalesInvoicePdfFilename(invoiceNumber: string): string {
  const slug = invoiceNumber.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `auroranexis-invoice-${slug || "preview"}.pdf`;
}
