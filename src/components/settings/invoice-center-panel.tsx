"use client";

import type { CustomerInvoiceView } from "@/lib/billing/types";
import { formatInvoiceDueLabel } from "@/lib/billing/types";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import { cn } from "@/lib/utils/cn";

type InvoiceCenterPanelProps = {
  invoices: CustomerInvoiceView[];
  canManage: boolean;
};

function statusTone(status: string): string {
  switch (status) {
    case "paid":
      return "border-success/25 bg-success/10 text-success";
    case "open":
      return "border-warning/25 bg-warning/10 text-warning";
    case "uncollectible":
    case "void":
      return "border-danger/25 bg-danger/10 text-danger";
    default:
      return "border-border bg-muted/10 text-muted";
  }
}

export function InvoiceCenterPanel({ invoices, canManage }: InvoiceCenterPanelProps) {
  const paid = invoices.filter((invoice) => invoice.status === "paid");
  const open = invoices.filter((invoice) => invoice.status === "open" || invoice.status === "draft");

  return (
    <PageSurface>
      <PageSurfaceHeading
        title="Invoice center"
        description="Stripe-synchronized invoice history with PDF downloads and hosted invoice links."
      />
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Total invoices</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{invoices.length}</p>
        </div>
        <div className="rounded-xl border border-border/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Paid</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{paid.length}</p>
        </div>
        <div className="rounded-xl border border-border/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Open / upcoming</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{open.length}</p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          No invoices synced yet. Invoices appear after Stripe checkout and webhook processing.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border/70 text-left text-muted">
                <th className="py-2 pr-4 font-medium">Invoice</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Amount</th>
                <th className="py-2 pr-4 font-medium">Period</th>
                <th className="py-2 pr-4 font-medium">Due / paid</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border/40">
                  <td className="py-3 pr-4 font-mono text-xs text-foreground">{invoice.stripeInvoiceId}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                        statusTone(invoice.status),
                      )}
                    >
                      {invoice.isFuture ? "Upcoming" : invoice.statusLabel}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-foreground">{invoice.formattedAmount}</td>
                  <td className="py-3 pr-4 text-muted">{invoice.periodLabel ?? "—"}</td>
                  <td className="py-3 pr-4 text-muted">{formatInvoiceDueLabel(invoice)}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      {invoice.invoicePdfUrl ? (
                        <a
                          href={invoice.invoicePdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted/10"
                        >
                          PDF
                        </a>
                      ) : null}
                      {invoice.hostedInvoiceUrl ? (
                        <a
                          href={invoice.hostedInvoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-md px-2 py-1 text-xs font-medium text-primary hover:underline"
                        >
                          View
                        </a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canManage ? (
        <p className="mt-4 text-xs text-muted">
          Manage payment methods and download additional invoices in the Stripe customer portal.
        </p>
      ) : null}
    </PageSurface>
  );
}
