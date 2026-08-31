import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoSwitcher } from "@/components/einvoice-viewer/DemoSwitcher";
import {
  EInvoiceViewer,
  EInvoiceViewerError,
} from "@/components/einvoice-viewer/EInvoiceViewer";
import { loadCertifiedDemoXml } from "@/lib/einvoice-viewer/demo-artifacts";
import {
  EINVOICE_VIEWER_DEMO_META,
  isEInvoiceViewerPreviewAllowed,
  resolveEInvoiceViewerDemoId,
} from "@/lib/einvoice-viewer/demo-catalog";
import { parseEInvoiceXml } from "@/lib/einvoice-viewer/parser";
import {
  viewerFailureDetail,
  viewerFailureTitle,
} from "@/lib/einvoice-viewer/validation-display";

export const metadata: Metadata = {
  title: "E-Invoice Viewer (local preview)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ demo?: string }>;
};

/**
 * Local/dev operator preview for certified demo XML only.
 * Not a public production invoice surface — gated by development runtime.
 */
export default async function EInvoicePreviewPage({ searchParams }: PageProps) {
  if (!isEInvoiceViewerPreviewAllowed()) {
    notFound();
  }

  const params = await searchParams;
  const demoId = resolveEInvoiceViewerDemoId(params.demo);
  const meta = EINVOICE_VIEWER_DEMO_META[demoId];
  const xml = loadCertifiedDemoXml(demoId);
  const parsed = parseEInvoiceXml(xml);
  const downloadHref = `/internal/einvoice-preview/download?demo=${demoId}`;

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 space-y-3 print:hidden">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Internal · local / development only
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          E-Invoice Viewer
        </h1>
        <p className="max-w-2xl text-sm text-muted">
          Read-only inspection of certified demo CII XML. Values come from the XML
          artifact — not from Billing. Active demo: {meta.invoiceNumber}.
        </p>
        <DemoSwitcher active={demoId} />
      </div>

      {parsed.ok ? (
        <EInvoiceViewer model={parsed.model} downloadHref={downloadHref} />
      ) : (
        <EInvoiceViewerError
          title={viewerFailureTitle(parsed)}
          detail={viewerFailureDetail(parsed)}
        />
      )}
    </main>
  );
}
