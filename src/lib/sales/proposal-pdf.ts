import PDFDocument from "pdfkit";
import type { ProposalContent } from "@/lib/sales/proposal-generator";

type PdfDoc = InstanceType<typeof PDFDocument>;

function section(doc: PdfDoc, title: string, body: string) {
  doc.fontSize(12).font("Helvetica-Bold").text(title);
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica").text(body, { align: "left" });
  doc.moveDown(0.8);
}

export async function generateProposalPdf(content: ProposalContent): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).font("Helvetica-Bold").text(content.title);
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica").fillColor("#555555").text(`Generated ${new Date().toLocaleDateString()}`);
    doc.fillColor("#000000");
    doc.moveDown(1);

    section(doc, "Pilot Agreement", content.pilotAgreement);
    section(doc, "Pricing Proposal", content.pricingProposal);
    section(doc, "ROI Estimate", content.roiEstimate);
    section(doc, "Timeline", content.timeline);
    section(doc, "Implementation Plan", content.implementationPlan);

    doc.fontSize(11).font("Helvetica-Bold").text(
      `Proposed MRR: $${content.mrrProposed.toLocaleString()} · ARR: $${content.arrProposed.toLocaleString()}`,
    );

    doc.end();
  });
}

export function buildProposalExportFilename(companyName: string): string {
  const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `auroranexis-proposal-${slug || "customer"}.pdf`;
}
