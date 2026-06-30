import PDFDocument from "pdfkit";
import {
  getCompanyInitial,
  getPoweredByLine,
  PLATFORM_NAME,
  type ResolvedOrganizationBranding,
} from "@/lib/branding/defaults";
import {
  formatReportDate,
  formatReportPeriod,
  REPORT_STATUS_LABELS,
  type ClientReportMetrics,
  type RelatedOpenIncident,
  type RelatedOpenRisk,
  type ReportWithRelations,
} from "@/lib/reports/types";
import { slugifyOrganizationName } from "@/lib/tenancy/context";
import type { ReportStatus } from "@/types/database";

export type ReportPdfInput = {
  branding: ResolvedOrganizationBranding;
  report: ReportWithRelations;
  metrics: ClientReportMetrics;
  relatedRisks: RelatedOpenRisk[];
  relatedIncidents: RelatedOpenIncident[];
  generatedAt: Date;
};

const NAVY = "#0f172a";
const SLATE = "#64748b";
const BODY = "#334155";
const BORDER = "#e2e8f0";
const WHITE = "#ffffff";
const MUTED = "#94a3b8";
const ACCENT = "#2563eb";
const LIGHT_BLUE = "#eff6ff";
const LIGHT_RED = "#fee2e2";
const RED = "#dc2626";
const LIGHT_GREEN = "#dcfce7";
const GREEN = "#16a34a";
const TABLE_HEAD = "#f8fafc";

const MARGIN = 48;
const HEADER_BAR = 68;
const GRID_GAP = 10;
const FOOTER_ZONE = 42;

type PdfDoc = InstanceType<typeof PDFDocument>;

type RelatedRow = {
  title: string;
  severity: string;
  status: string;
  due: string;
};

function pageWidth(doc: PdfDoc): number {
  return doc.page.width;
}

function contentWidth(doc: PdfDoc): number {
  return pageWidth(doc) - MARGIN * 2;
}

function pageBottom(doc: PdfDoc): number {
  return doc.page.height - MARGIN - FOOTER_ZONE;
}

function ensureSpace(doc: PdfDoc, neededHeight: number): void {
  if (doc.y + neededHeight > pageBottom(doc)) {
    doc.addPage();
    doc.x = MARGIN;
    doc.y = MARGIN;
  }
}

function capitalizeLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function textLines(value: string | null | undefined): string[] {
  if (!value?.trim()) {
    return ["—"];
  }

  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function drawIconCircle(
  doc: PdfDoc,
  x: number,
  y: number,
  size: number,
  fill: string,
  glyph: string,
  glyphColor = WHITE,
): void {
  const radius = size / 2;
  doc.circle(x + radius, y + radius, radius).fill(fill);
  doc
    .fillColor(glyphColor)
    .font("Helvetica-Bold")
    .fontSize(size * 0.42)
    .text(glyph, x, y + size * 0.22, { width: size, align: "center", lineBreak: false });
}

function drawPill(
  doc: PdfDoc,
  x: number,
  y: number,
  text: string,
  fill: string,
  color: string,
): number {
  doc.font("Helvetica-Bold").fontSize(7);
  const pillWidth = doc.widthOfString(text) + 14;
  doc.roundedRect(x, y, pillWidth, 14, 7).fill(fill);
  doc.fillColor(color).text(text, x + 7, y + 3, { lineBreak: false });
  return pillWidth;
}

function reportStatusColors(status: ReportStatus): { fill: string; color: string } {
  switch (status) {
    case "published":
      return { fill: LIGHT_GREEN, color: GREEN };
    case "generated":
      return { fill: "#fef3c7", color: "#d97706" };
    case "archived":
      return { fill: "#f1f5f9", color: SLATE };
    default:
      return { fill: LIGHT_BLUE, color: ACCENT };
  }
}

function severityColors(severity: string): { fill: string; color: string } {
  switch (severity) {
    case "critical":
      return { fill: LIGHT_RED, color: RED };
    case "high":
      return { fill: "#ffedd5", color: "#ea580c" };
    case "medium":
      return { fill: "#fef3c7", color: "#d97706" };
    default:
      return { fill: "#f1f5f9", color: SLATE };
  }
}

function statusColors(status: string): { fill: string; color: string } {
  if (status === "resolved" || status === "archived") {
    return { fill: "#f1f5f9", color: SLATE };
  }

  return { fill: LIGHT_GREEN, color: GREEN };
}

async function fetchLogoBuffer(logoUrl: string | null): Promise<Buffer | null> {
  if (!logoUrl) {
    return null;
  }

  try {
    const response = await fetch(logoUrl, { signal: AbortSignal.timeout(5000) });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.startsWith("image/")) {
      return null;
    }

    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

function drawHeaderLogo(
  doc: PdfDoc,
  branding: ResolvedOrganizationBranding,
  logoBuffer: Buffer | null,
): number {
  const logoSize = 28;
  const textOffset = MARGIN + logoSize + 8;

  if (logoBuffer) {
    try {
      doc.image(logoBuffer, MARGIN, 18, { fit: [logoSize, logoSize] });
      return textOffset;
    } catch {
      // Fall through to initial badge when image decode fails.
    }
  }

  drawIconCircle(
    doc,
    MARGIN,
    18,
    logoSize,
    branding.primaryColor,
    getCompanyInitial(branding.companyName),
  );

  return textOffset;
}

function drawTopHeader(
  doc: PdfDoc,
  generatedAt: Date,
  branding: ResolvedOrganizationBranding,
  logoBuffer: Buffer | null,
): void {
  const width = contentWidth(doc);
  const generated = formatReportDate(generatedAt.toISOString());
  const companyLabel = branding.companyName.trim() || PLATFORM_NAME;

  doc.save();
  doc.rect(0, 0, pageWidth(doc), HEADER_BAR).fill(branding.secondaryColor);

  const textOffset = drawHeaderLogo(doc, branding, logoBuffer);
  doc
    .fillColor(WHITE)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(companyLabel.toUpperCase(), textOffset, 22, { lineBreak: false });
  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(8)
    .text("Client Operations Report", textOffset, 38, { lineBreak: false });

  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(7)
    .text("Generated", MARGIN, 20, { width, align: "right", lineBreak: false });
  doc
    .fillColor(WHITE)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(generated, MARGIN, 32, { width, align: "right", lineBreak: false });

  doc.restore();

  doc.x = MARGIN;
  doc.y = HEADER_BAR + 14;
}

function drawReportTitle(doc: PdfDoc, title: string): void {
  const width = contentWidth(doc);

  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(20).text(title, { width, lineGap: 1 });
  doc.moveDown(0.55);
}

function drawMetadataGrid(
  doc: PdfDoc,
  client: string,
  period: string,
  status: ReportStatus,
  generated: string,
): void {
  const width = contentWidth(doc);
  const colWidth = (width - GRID_GAP) / 2;
  const cardHeight = 52;
  const gridHeight = cardHeight * 2 + GRID_GAP;

  ensureSpace(doc, gridHeight + 8);

  const startY = doc.y;
  const cards: {
    icon: string;
    iconFill: string;
    label: string;
    value: string;
    badge?: ReportStatus;
  }[] = [
    { icon: "C", iconFill: LIGHT_BLUE, label: "Client", value: client },
    { icon: "P", iconFill: LIGHT_BLUE, label: "Report period", value: period },
    { icon: "S", iconFill: LIGHT_BLUE, label: "Status", value: REPORT_STATUS_LABELS[status], badge: status },
    { icon: "G", iconFill: LIGHT_BLUE, label: "Generated", value: generated },
  ];

  cards.forEach((card, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN + col * (colWidth + GRID_GAP);
    const y = startY + row * (cardHeight + GRID_GAP);

    doc.roundedRect(x, y, colWidth, cardHeight, 6).fillAndStroke(WHITE, BORDER);
    drawIconCircle(doc, x + 10, y + 12, 24, card.iconFill, card.icon, ACCENT);

    doc
      .fillColor(SLATE)
      .font("Helvetica-Bold")
      .fontSize(6.5)
      .text(card.label.toUpperCase(), x + 42, y + 13, { width: colWidth - 52, lineBreak: false });

    if (card.badge) {
      const colors = reportStatusColors(card.badge);
      drawPill(doc, x + 42, y + 26, card.value, colors.fill, colors.color);
    } else {
      doc
        .fillColor(NAVY)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(card.value, x + 42, y + 26, { width: colWidth - 52, lineGap: 1 });
    }
  });

  doc.x = MARGIN;
  doc.y = startY + gridHeight + 8;
}

function drawNarrativeCard(
  doc: PdfDoc,
  icon: string,
  iconFill: string,
  title: string,
  body: string | null | undefined,
): void {
  const width = contentWidth(doc);
  const padding = 12;
  const iconSize = 24;
  const textX = MARGIN + padding + iconSize + 10;
  const textWidth = width - padding * 2 - iconSize - 10;
  const bodyText = body?.trim() || "—";

  doc.font("Helvetica").fontSize(9);
  const bodyHeight = doc.heightOfString(bodyText, { width: textWidth, lineGap: 2 });
  const cardHeight = Math.max(46, padding + 14 + bodyHeight + padding);

  ensureSpace(doc, cardHeight + 8);

  const y = doc.y;
  doc.roundedRect(MARGIN, y, width, cardHeight, 6).fillAndStroke(WHITE, BORDER);
  drawIconCircle(doc, MARGIN + padding, y + padding, iconSize, iconFill, icon, ACCENT);
  doc
    .fillColor(NAVY)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(title, textX, y + padding, { width: textWidth, lineBreak: false });
  doc
    .fillColor(BODY)
    .font("Helvetica")
    .fontSize(9)
    .text(bodyText, textX, y + padding + 14, { width: textWidth, lineGap: 2 });

  doc.x = MARGIN;
  doc.y = y + cardHeight + 8;
}

function estimateBulletColumnHeight(doc: PdfDoc, colWidth: number, lines: string[]): number {
  doc.font("Helvetica").fontSize(9);
  let height = 16;

  lines.forEach((line) => {
    height += doc.heightOfString(`• ${line}`, { width: colWidth, lineGap: 1 }) + 2;
  });

  return height + 4;
}

function drawBulletColumn(
  doc: PdfDoc,
  x: number,
  y: number,
  colWidth: number,
  icon: string,
  iconFill: string,
  title: string,
  lines: string[],
): number {
  drawIconCircle(doc, x, y, 18, iconFill, icon, ACCENT);
  doc
    .fillColor(NAVY)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(title, x + 24, y + 1, { width: colWidth - 24, lineBreak: false });

  let cy = y + 18;
  doc.fillColor(BODY).font("Helvetica").fontSize(9);

  lines.forEach((line) => {
    const bullet = `• ${line}`;
    doc.text(bullet, x, cy, { width: colWidth, lineGap: 1 });
    cy += doc.heightOfString(bullet, { width: colWidth, lineGap: 1 }) + 2;
  });

  return cy;
}

function drawWinsAndRisksColumns(
  doc: PdfDoc,
  wins: string | null | undefined,
  risks: string | null | undefined,
): void {
  const width = contentWidth(doc);
  const gap = 12;
  const colWidth = (width - gap) / 2;
  const winLines = textLines(wins);
  const riskLines = textLines(risks);

  doc.font("Helvetica").fontSize(9);
  const blockHeight = Math.max(
    estimateBulletColumnHeight(doc, colWidth, winLines),
    estimateBulletColumnHeight(doc, colWidth, riskLines),
  );

  ensureSpace(doc, blockHeight + 8);

  const startY = doc.y;
  const leftBottom = drawBulletColumn(
    doc,
    MARGIN,
    startY,
    colWidth,
    "W",
    LIGHT_BLUE,
    "Key wins",
    winLines,
  );
  const rightBottom = drawBulletColumn(
    doc,
    MARGIN + colWidth + gap,
    startY,
    colWidth,
    "!",
    LIGHT_RED,
    "Key risks",
    riskLines,
  );

  doc.x = MARGIN;
  doc.y = Math.max(leftBottom, rightBottom) + 8;
}

function drawDivider(doc: PdfDoc): void {
  ensureSpace(doc, 8);
  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(MARGIN + contentWidth(doc), doc.y)
    .strokeColor(BORDER)
    .lineWidth(0.75)
    .stroke();
  doc.y += 10;
}

function drawMetricGrid(doc: PdfDoc, metrics: ClientReportMetrics): void {
  const width = contentWidth(doc);
  const colWidth = (width - GRID_GAP) / 2;
  const cardHeight = 48;
  const gridHeight = cardHeight * 2 + GRID_GAP;

  ensureSpace(doc, 16 + gridHeight);

  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11).text("Client metrics", { width });
  doc.moveDown(0.35);

  const startY = doc.y;
  const cards: { label: string; value: number; icon: string; iconFill: string; iconColor: string }[] =
    [
      { label: "Open risks", value: metrics.openRisksCount, icon: "R", iconFill: LIGHT_BLUE, iconColor: ACCENT },
      {
        label: "Critical risks",
        value: metrics.criticalRisksCount,
        icon: "R",
        iconFill: LIGHT_RED,
        iconColor: RED,
      },
      {
        label: "Open incidents",
        value: metrics.openIncidentsCount,
        icon: "I",
        iconFill: LIGHT_BLUE,
        iconColor: ACCENT,
      },
      {
        label: "Critical incidents",
        value: metrics.criticalIncidentsCount,
        icon: "I",
        iconFill: LIGHT_RED,
        iconColor: RED,
      },
    ];

  cards.forEach((card, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN + col * (colWidth + GRID_GAP);
    const y = startY + row * (cardHeight + GRID_GAP);

    doc.roundedRect(x, y, colWidth, cardHeight, 6).fillAndStroke(WHITE, BORDER);
    drawIconCircle(doc, x + 10, y + 12, 22, card.iconFill, card.icon, card.iconColor);

    doc
      .fillColor(SLATE)
      .font("Helvetica-Bold")
      .fontSize(6.5)
      .text(card.label.toUpperCase(), x + 40, y + 12, { width: colWidth - 50, lineBreak: false });
    doc
      .fillColor(NAVY)
      .font("Helvetica-Bold")
      .fontSize(18)
      .text(String(card.value), x + 40, y + 24, { width: colWidth - 50, lineBreak: false });
  });

  doc.x = MARGIN;
  doc.y = startY + gridHeight + 10;
}

function drawCompactTable(
  doc: PdfDoc,
  x: number,
  y: number,
  tableWidth: number,
  title: string,
  nameHeader: string,
  rows: RelatedRow[],
  emptyMessage: string,
): number {
  const colPercents = [0.34, 0.2, 0.2, 0.26];
  const colWidths = colPercents.map((pct) => tableWidth * pct);
  const headerHeight = 16;
  const rowHeight = 18;

  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(9).text(title, x, y, {
    width: tableWidth,
    lineBreak: false,
  });

  let cy = y + 14;

  doc.roundedRect(x, cy, tableWidth, headerHeight, 4).fill(TABLE_HEAD);
  doc.fillColor(SLATE).font("Helvetica-Bold").fontSize(6.5);

  const headerCols = [nameHeader, "SEVERITY", "STATUS", "DUE DATE"];
  const headerX = [
    x + 6,
    x + colWidths[0] + 4,
    x + colWidths[0] + colWidths[1] + 4,
    x + colWidths[0] + colWidths[1] + colWidths[2] + 4,
  ];

  headerCols.forEach((label, index) => {
    doc.text(label, headerX[index], cy + 5, { width: colWidths[index] - 8, lineBreak: false });
  });

  cy += headerHeight;

  if (rows.length === 0) {
    doc
      .fillColor(SLATE)
      .font("Helvetica")
      .fontSize(8)
      .text(emptyMessage, x + 6, cy + 5, { width: tableWidth - 12, lineBreak: false });
    cy += rowHeight;
  } else {
    rows.forEach((row) => {
      const colX = [
        x + 6,
        x + colWidths[0] + 4,
        x + colWidths[0] + colWidths[1] + 4,
        x + colWidths[0] + colWidths[1] + colWidths[2] + 4,
      ];

      doc.rect(x, cy, tableWidth, rowHeight).stroke(BORDER);

      doc.fillColor(NAVY).font("Helvetica").fontSize(8).text(row.title, colX[0], cy + 5, {
        width: colWidths[0] - 10,
        lineBreak: false,
      });

      const sev = severityColors(row.severity);
      drawPill(doc, colX[1], cy + 2, capitalizeLabel(row.severity), sev.fill, sev.color);

      const stat = statusColors(row.status);
      drawPill(doc, colX[2], cy + 2, capitalizeLabel(row.status), stat.fill, stat.color);

      doc.fillColor(BODY).font("Helvetica").fontSize(8).text(row.due, colX[3], cy + 5, {
        width: colWidths[3] - 10,
        lineBreak: false,
      });

      cy += rowHeight;
    });
  }

  return cy;
}

function drawRelatedTables(
  doc: PdfDoc,
  risks: RelatedRow[],
  incidents: RelatedRow[],
): void {
  const width = contentWidth(doc);
  const gap = 12;
  const tableWidth = (width - gap) / 2;
  const maxRows = Math.max(risks.length || 1, incidents.length || 1);
  const blockHeight = 14 + 16 + maxRows * 18 + 8;

  ensureSpace(doc, blockHeight);

  const startY = doc.y;
  const leftBottom = drawCompactTable(
    doc,
    MARGIN,
    startY,
    tableWidth,
    "Related open risks",
    "RISK",
    risks,
    "No open risks",
  );
  const rightBottom = drawCompactTable(
    doc,
    MARGIN + tableWidth + gap,
    startY,
    tableWidth,
    "Related open incidents",
    "INCIDENT",
    incidents,
    "No open incidents",
  );

  doc.x = MARGIN;
  doc.y = Math.max(leftBottom, rightBottom) + 6;
}

function decoratePages(doc: PdfDoc, branding: ResolvedOrganizationBranding): void {
  const range = doc.bufferedPageRange();
  const width = contentWidth(doc);
  const totalPages = range.count;
  const watermark = (branding.companyName.trim() || PLATFORM_NAME).toUpperCase();

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    doc.switchToPage(range.start + pageIndex);

    doc.save();

    doc.opacity(0.05);
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(46);
    const watermarkWidth = doc.widthOfString(watermark);
    doc.text(watermark, (pageWidth(doc) - watermarkWidth) / 2, doc.page.height - 210, {
      lineBreak: false,
    });
    doc.opacity(1);

    const lineY = doc.page.height - MARGIN - 24;
    doc
      .moveTo(MARGIN, lineY)
      .lineTo(MARGIN + width, lineY)
      .strokeColor(BORDER)
      .lineWidth(0.5)
      .stroke();

    doc.fillColor(MUTED).font("Helvetica").fontSize(6.5);
    doc.text(getPoweredByLine(branding), MARGIN, lineY + 7, { lineBreak: false });
    doc.fillColor(SLATE).font("Helvetica").fontSize(7);
    doc.text("Confidential — For client use only", MARGIN, lineY + 16, { lineBreak: false });

    if (totalPages > 1) {
      doc.text(`Page ${pageIndex + 1} of ${totalPages}`, MARGIN, lineY + 16, {
        width,
        align: "right",
        lineBreak: false,
      });
    }

    doc.restore();
  }

  doc.switchToPage(range.start + totalPages - 1);
  doc.x = MARGIN;
}

/** Build a safe download filename for a report PDF export. */
export function buildReportExportFilename(clientName: string, periodEnd: string): string {
  const slug = slugifyOrganizationName(clientName || "client");
  return `auroranexis-report-${slug}-${periodEnd.slice(0, 10)}.pdf`;
}

/** Generate a client-ready PDF buffer for a report. */
export async function generateReportPdf(input: ReportPdfInput): Promise<Buffer> {
  const logoBuffer = await fetchLogoBuffer(input.branding.logoUrl);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: MARGIN,
      bufferPages: true,
    });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.x = MARGIN;
    doc.y = MARGIN;

    const { branding, report, metrics, relatedRisks, relatedIncidents, generatedAt } = input;
    const generated = formatReportDate(generatedAt.toISOString());

    drawTopHeader(doc, generatedAt, branding, logoBuffer);
    drawReportTitle(doc, report.title);
    drawMetadataGrid(
      doc,
      report.clients?.name ?? "—",
      formatReportPeriod(report.reporting_period_start, report.reporting_period_end),
      report.status as ReportStatus,
      generated,
    );

    drawNarrativeCard(doc, "E", LIGHT_BLUE, "Executive summary", report.executive_summary);
    drawWinsAndRisksColumns(doc, report.key_wins, report.key_risks);
    drawDivider(doc);
    drawNarrativeCard(doc, "N", LIGHT_BLUE, "Next actions", report.next_actions);
    drawMetricGrid(doc, metrics);

    drawRelatedTables(
      doc,
      relatedRisks.map((risk) => ({
        title: risk.title,
        severity: risk.severity,
        status: risk.status,
        due: risk.due_date ? formatReportDate(risk.due_date) : "—",
      })),
      relatedIncidents.map((incident) => ({
        title: incident.title,
        severity: incident.severity,
        status: incident.status,
        due: incident.due_at ? formatReportDate(incident.due_at) : "—",
      })),
    );

    decoratePages(doc, branding);
    doc.end();
  });
}
