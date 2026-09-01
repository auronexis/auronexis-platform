import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import {
  EInvoiceViewer,
  EInvoiceViewerError,
} from "@/components/einvoice-viewer/EInvoiceViewer";
import { ArchiveIntegrityButton } from "@/components/einvoice-archive/archive-integrity-button";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { canAccessEInvoiceArchive } from "@/lib/einvoice-archive/authorization";
import { createProductionArchivePorts } from "@/lib/einvoice-archive/supabase-ports";
import { loadArchivedEInvoiceForView } from "@/lib/einvoice-archive/archive";
import { parseEInvoiceXml } from "@/lib/einvoice-viewer/parser";
import {
  viewerFailureDetail,
  viewerFailureTitle,
} from "@/lib/einvoice-viewer/validation-display";
import { formatAppDate, formatAppDateTime, formatMoneyFromCentsLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Archived E-Invoice",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EInvoiceArchiveDetailPage({ params }: PageProps) {
  await requireModuleAccess("dashboard");
  const session = await requireSession();
  if (!canAccessEInvoiceArchive(session)) {
    redirect("/dashboard");
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    notFound();
  }

  const loaded = await loadArchivedEInvoiceForView(
    {
      organizationId: session.organization.id,
      archiveId: id,
      actorUserId: session.user.id,
    },
    createProductionArchivePorts(),
  );

  if (!loaded.ok) {
    notFound();
  }

  const locale = session.organization.language === "de" ? "de" : "en";
  const parsed = parseEInvoiceXml(loaded.xml);
  const downloadHref = `/dashboard/compliance/einvoice-archive/${id}/download`;
  const row = loaded.record;

  return (
    <>
      <PageHeader
        module="dashboard"
        title={row.invoiceNumberSnapshot}
        description="ARCHIVED E-INVOICE — original XML bytes from the compliance archive."
        action={
          <Link
            href="/dashboard/compliance/einvoice-archive"
            className="text-sm font-medium text-accent-blue hover:underline"
          >
            Back to archive
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <PageSurface>
          <PageSurfaceHeading
            title="Archive metadata"
            description="Evidence snapshots captured at archive time. Billing records are not re-read for display."
          />
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Integrity</dt>
              <dd className="mt-1">
                <StatusBadge tone={row.integrityStatus === "verified" ? "success" : row.integrityStatus === "failed" ? "danger" : "info"}>
                  {row.integrityStatus === "verified" ? "VERIFIED" : row.integrityStatus.toUpperCase()}
                </StatusBadge>
              </dd>
            </div>
            <div>
              <dt className="text-muted">SHA-256</dt>
              <dd className="mt-1 break-all font-mono text-xs">{row.artifactSha256}</dd>
            </div>
            <div>
              <dt className="text-muted">Archived</dt>
              <dd className="mt-1">{formatAppDateTime(row.archivedAt, locale)}</dd>
            </div>
            <div>
              <dt className="text-muted">Issue date</dt>
              <dd className="mt-1">
                {row.issueDateSnapshot ? formatAppDate(row.issueDateSnapshot, locale) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Gross</dt>
              <dd className="mt-1">
                {formatMoneyFromCentsLocale(row.grossAmountMinorSnapshot, row.currencySnapshot, locale)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Tax treatment</dt>
              <dd className="mt-1">{row.taxTreatmentSnapshot}</dd>
            </div>
            <div>
              <dt className="text-muted">Countries</dt>
              <dd className="mt-1">
                Seller {row.sellerCountrySnapshot ?? "—"} · Buyer {row.buyerCountrySnapshot ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Retain until</dt>
              <dd className="mt-1">
                {formatAppDate(row.retention.retainUntil, locale)} ({row.retention.policyId} v
                {row.retention.policyVersion})
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted">Retention basis</dt>
              <dd className="mt-1 text-muted">{row.retention.legalBasis}</dd>
            </div>
            <div>
              <dt className="text-muted">Legal hold</dt>
              <dd className="mt-1">{row.legalHold ? "Active" : "None"}</dd>
            </div>
            <div>
              <dt className="text-muted">Expired retain_until</dt>
              <dd className="mt-1">Informational only — never auto-deleted.</dd>
            </div>
          </dl>
          <div className="mt-4">
            <ArchiveIntegrityButton archiveId={row.id} />
          </div>
        </PageSurface>
      </div>

      {parsed.ok ? (
        <EInvoiceViewer model={parsed.model} downloadHref={downloadHref} archived />
      ) : (
        <EInvoiceViewerError
          title={viewerFailureTitle(parsed)}
          detail={viewerFailureDetail(parsed)}
        />
      )}
    </>
  );
}
