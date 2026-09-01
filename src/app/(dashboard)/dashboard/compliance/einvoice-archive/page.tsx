import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Archive } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { StatusBadge } from "@/components/ui/badge";
import {
  AuroraDataTable,
  AuroraTable,
  AuroraTableBody,
  AuroraTableCell,
  AuroraTableHead,
  AuroraTableHeaderCell,
  AuroraTableRow,
} from "@/components/ui/table";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { canAccessEInvoiceArchive } from "@/lib/einvoice-archive/authorization";
import { listEInvoiceArchivesForSession } from "@/lib/einvoice-archive/queries";
import { parseArchiveSearchQuery } from "@/lib/einvoice-archive/search";
import { formatAppDate, formatMoneyFromCentsLocale } from "@/lib/i18n";
import { formControl, formControlHeight, formLabel, nativeSelectControl } from "@/lib/ui/form-tokens";
import { cn } from "@/lib/utils/cn";
import type { EInvoiceArchiveIntegrityStatus } from "@/lib/einvoice-archive/types";

export const metadata: Metadata = {
  title: "E-Invoice Archive",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function integrityTone(status: EInvoiceArchiveIntegrityStatus) {
  if (status === "verified") return "success" as const;
  if (status === "failed") return "danger" as const;
  return "info" as const;
}

export default async function EInvoiceArchiveListPage({ searchParams }: PageProps) {
  await requireModuleAccess("dashboard");
  const session = await requireSession();
  if (!canAccessEInvoiceArchive(session)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const query = parseArchiveSearchQuery(params);
  const listed = await listEInvoiceArchivesForSession(session, query);
  const locale = session.organization.language === "de" ? "de" : "en";

  return (
    <>
      <PageHeader
        module="dashboard"
        title="E-Invoice Archive"
        description="Immutable compliance archive of validated e-invoice XML. Viewer and downloads read archived bytes only — never live billing."
        action={
          <Link
            href="/dashboard/compliance"
            className="text-sm font-medium text-accent-blue hover:underline"
          >
            Back to compliance
          </Link>
        }
      />

      <form method="get" className="mb-6 grid gap-4 rounded-xl border border-border/70 bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1">
          <span className={formLabel}>Invoice number</span>
          <input
            name="invoiceNumber"
            defaultValue={query.invoiceNumber}
            className={cn(formControl, formControlHeight)}
          />
        </label>
        <label className="space-y-1">
          <span className={formLabel}>Customer</span>
          <input name="customer" defaultValue={query.customer} className={cn(formControl, formControlHeight)} />
        </label>
        <label className="space-y-1">
          <span className={formLabel}>Issue date</span>
          <input
            type="date"
            name="issueDate"
            defaultValue={query.issueDate}
            className={cn(formControl, formControlHeight)}
          />
        </label>
        <label className="space-y-1">
          <span className={formLabel}>Year</span>
          <input name="year" defaultValue={query.year} inputMode="numeric" className={cn(formControl, formControlHeight)} />
        </label>
        <label className="space-y-1">
          <span className={formLabel}>Tax treatment</span>
          <input
            name="taxTreatment"
            defaultValue={query.taxTreatment}
            className={cn(formControl, formControlHeight)}
          />
        </label>
        <label className="space-y-1">
          <span className={formLabel}>Country</span>
          <input
            name="country"
            defaultValue={query.country}
            maxLength={2}
            className={cn(formControl, formControlHeight)}
          />
        </label>
        <label className="space-y-1">
          <span className={formLabel}>Integrity</span>
          <select name="integrity" defaultValue={query.integrity ?? ""} className={nativeSelectControl}>
            <option value="">Any</option>
            <option value="stored">Stored</option>
            <option value="verified">Verified</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <div className="flex items-end">
          <Button type="submit" size="sm">
            Search
          </Button>
        </div>
      </form>

      {!listed.ok ? <FormAlert variant="error">{listed.message}</FormAlert> : null}

      {listed.ok && listed.records.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="No archived e-invoices"
          description="This workspace has no immutable e-invoice archive records yet. Archival is an isolated compliance path and is not wired to checkout, Mollie, or invoice email."
        />
      ) : null}

      {listed.ok && listed.records.length > 0 ? (
        <AuroraDataTable>
          <AuroraTable>
            <AuroraTableHead>
              <tr>
                <AuroraTableHeaderCell>Invoice</AuroraTableHeaderCell>
                <AuroraTableHeaderCell>Customer</AuroraTableHeaderCell>
                <AuroraTableHeaderCell>Issue date</AuroraTableHeaderCell>
                <AuroraTableHeaderCell>Tax</AuroraTableHeaderCell>
                <AuroraTableHeaderCell>Gross</AuroraTableHeaderCell>
                <AuroraTableHeaderCell>Integrity</AuroraTableHeaderCell>
              </tr>
            </AuroraTableHead>
            <AuroraTableBody>
              {listed.records.map((row) => (
                <AuroraTableRow key={row.id}>
                  <AuroraTableCell>
                    <Link
                      href={`/dashboard/compliance/einvoice-archive/${row.id}`}
                      className="font-medium text-accent-blue hover:underline"
                    >
                      {row.invoiceNumberSnapshot}
                    </Link>
                  </AuroraTableCell>
                  <AuroraTableCell>{row.buyerNameSnapshot ?? "—"}</AuroraTableCell>
                  <AuroraTableCell className="whitespace-nowrap text-muted">
                    {row.issueDateSnapshot ? formatAppDate(row.issueDateSnapshot, locale) : "—"}
                  </AuroraTableCell>
                  <AuroraTableCell className="text-muted">{row.taxTreatmentSnapshot}</AuroraTableCell>
                  <AuroraTableCell className="whitespace-nowrap">
                    {formatMoneyFromCentsLocale(row.grossAmountMinorSnapshot, row.currencySnapshot, locale)}
                  </AuroraTableCell>
                  <AuroraTableCell>
                    <StatusBadge tone={integrityTone(row.integrityStatus)}>
                      {row.integrityStatus === "verified" ? "VERIFIED" : row.integrityStatus.toUpperCase()}
                    </StatusBadge>
                  </AuroraTableCell>
                </AuroraTableRow>
              ))}
            </AuroraTableBody>
          </AuroraTable>
        </AuroraDataTable>
      ) : null}
    </>
  );
}
