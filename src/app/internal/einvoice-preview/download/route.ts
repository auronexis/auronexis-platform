import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { loadCertifiedDemoXml } from "@/lib/einvoice-viewer/demo-artifacts";
import {
  EINVOICE_VIEWER_DEMO_META,
  isEInvoiceViewerPreviewAllowed,
  resolveEInvoiceViewerDemoId,
} from "@/lib/einvoice-viewer/demo-catalog";

export const dynamic = "force-dynamic";

/**
 * Returns exact certified demo XML bytes for download.
 * Development/local gate only — never regenerates XML.
 */
export async function GET(request: Request) {
  if (!isEInvoiceViewerPreviewAllowed()) {
    notFound();
  }

  const url = new URL(request.url);
  const demoId = resolveEInvoiceViewerDemoId(url.searchParams.get("demo"));
  const meta = EINVOICE_VIEWER_DEMO_META[demoId];
  const xml = loadCertifiedDemoXml(demoId);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${meta.filename}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
