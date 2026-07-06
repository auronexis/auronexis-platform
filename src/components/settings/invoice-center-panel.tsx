"use client";

import type { CustomerInvoiceView } from "@/lib/billing/types";
import { formatInvoiceDueLabel } from "@/lib/billing/types";
import {
  billingStatusToneToBadge,
  formatMoneyFromCents,
  getInvoiceDisplayLabel,
  getInvoiceStatusTone,
  isUnpaidInvoice,
  shortenStripeId,
} from "@/lib/billing/status";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import { cn } from "@/lib/utils/cn";

type InvoiceCenterPanelProps = {
  invoices: CustomerInvoiceView[];
  canManage: boolean;
  limit?: number;
};

function invoiceBadgeTone(invoice: CustomerInvoiceView): "green" | "amber" | "red" | "slate" {
  return billingStatusToneToBadge(getInvoiceStatusTone(invoice));
}

const BADGE_STYLES = {
  green: "border-success/25 bg-success/10 text-success",
  amber: "border-warning/25 bg-warning/10 text-warning",
  red: "border-danger/25 bg-danger/10 text-danger",
  slate: "border-border bg-muted/10 text-muted",
} as const;

export function InvoiceCenterPanel({ invoices, canManage, limit = 5 }: InvoiceCenterPanelProps) {
  const visibleInvoices = invoices.slice(0, limit);
  const paid = invoices.filter((invoice) => invoice.status === "paid");
  const open = invoices.filter(
    (invoice) =>
      invoice.status === "open" ||
      invoice.status === "draft" ||
      (invoice.status === "open" && invoice.amountPaid === 0),
  );

  return (
    <PageSurface>
      <PageSurfaceHeading
        title="Latest invoices"
        description="Stripe-synchronized invoice history. Open invoices with no payment yet are normal for SEPA or pending checkout."
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
          <p className="text-xs uppercase tracking-wide text-muted">Open / unpaid</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{open.length}</p>
        </div>
      </div>

      {visibleInvoices.length === 0 ? (
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
                <th className="py-2 pr-4 font-medium">Amount due</th>
                <th className="py-2 pr-4 font-medium">Amount paid</th>
                <th className="py-2 pr-4 font-medium">Period</th>
                <th className="py-2 pr-4 font-medium">Due / paid</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleInvoices.map((invoice) => {
                const tone = invoiceBadgeTone(invoice);
                return (
                  <tr key={invoice.id} className="border-b border-border/40">
                    <td className="py-3 pr-4 font-mono text-xs text-foreground">
                      {shortenStripeId(invoice.stripeInvoiceId)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                          BADGE_STYLES[tone],
                        )}
                      >
                        {getInvoiceDisplayLabel(invoice)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-foreground">
                      {formatMoneyFromCents(invoice.amountDue, invoice.currency)}
                    </td>
                    <td className="py-3 pr-4 text-foreground">
                      {formatMoneyFromCents(invoice.amountPaid, invoice.currency)}
                    </td>
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
                            Download invoice PDF
                          </a>
                        ) : null}
                        {isUnpaidInvoice(invoice) && invoice.hostedInvoiceUrl ? (
                          <a
                            href={invoice.hostedInvoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-md px-2 py-1 text-xs font-medium text-primary hover:underline"
                          >
                            Open invoice
                          </a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {invoices.length > limit ? (
        <p className="mt-4 text-xs text-muted">Showing the latest {limit} invoices.</p>
      ) : null}

      {canManage ? (
        <p className="mt-4 text-xs text-muted">
          Manage payment methods and download additional invoices in the Stripe customer portal.
        </p>
      ) : null}
    </PageSurface>
  );
}
