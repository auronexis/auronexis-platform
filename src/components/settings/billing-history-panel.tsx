"use client";

import { useState, useTransition } from "react";
import type { BillingHistoryItem } from "@/lib/billing/history-types";
import {
  openPaddleInvoicePdfAction,
  getBillingHistoryAction,
} from "@/lib/billing/invoice-actions";
import { formatMoneyFromCents } from "@/lib/billing/status";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { formatBillingDate } from "@/lib/billing/types";
import { cn } from "@/lib/utils/cn";

type BillingHistoryPanelProps = {
  initialItems: BillingHistoryItem[];
  canManage: boolean;
  pageSize?: number;
};

function shortenRef(value: string, visible = 12): string {
  if (value.length <= visible + 3) {
    return value;
  }
  return `${value.slice(0, visible)}…`;
}

export function BillingHistoryPanel({
  initialItems,
  canManage,
  pageSize = 10,
}: BillingHistoryPanelProps) {
  const [items, setItems] = useState(initialItems);
  const [offset, setOffset] = useState(initialItems.length);
  const [hasMore, setHasMore] = useState(initialItems.length >= pageSize);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pdfPendingId, setPdfPendingId] = useState<string | null>(null);

  const paidCount = items.filter((item) => item.paymentStatus === "paid").length;
  const unpaidCount = items.filter((item) => item.paymentStatus === "unpaid").length;

  const loadMore = () => {
    if (!canManage) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await getBillingHistoryAction({ limit: pageSize, offset });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItems((prev) => [...prev, ...result.items]);
      setOffset((prev) => prev + result.items.length);
      setHasMore(result.items.length >= pageSize);
    });
  };

  const openPdf = (providerTransactionId: string) => {
    if (!canManage) {
      return;
    }
    setError(null);
    setPdfPendingId(providerTransactionId);
    startTransition(async () => {
      const result = await openPaddleInvoicePdfAction(providerTransactionId);
      setPdfPendingId(null);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  };

  return (
    <PageSurface>
      <PageSurfaceHeading
        title="Billing history"
        description="Invoices and payments from Paddle. Tax amounts are shown as provided by Paddle as Merchant of Record."
      />

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Total</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{items.length}</p>
        </div>
        <div className="rounded-xl border border-border/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Paid</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{paidCount}</p>
        </div>
        <div className="rounded-xl border border-border/70 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Other</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{unpaidCount}</p>
        </div>
      </div>

      {error ? (
        <div className="mt-4">
          <FormAlert variant="warning">{error}</FormAlert>
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No invoices are available yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border/70 text-left text-muted">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Plan / product</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Subtotal</th>
                <th className="py-2 pr-4 font-medium">Tax</th>
                <th className="py-2 pr-4 font-medium">Total</th>
                <th className="py-2 pr-4 font-medium">Reference</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/40">
                  <td className="py-3 pr-4 text-foreground">
                    {formatBillingDate(item.date) ?? "—"}
                  </td>
                  <td className="py-3 pr-4 text-foreground">{item.productName ?? "Subscription"}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                        item.paymentStatus === "paid"
                          ? "border-success/25 bg-success/10 text-success"
                          : "border-warning/25 bg-warning/10 text-warning",
                      )}
                    >
                      {item.statusLabel}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {item.subtotalCents != null
                      ? formatMoneyFromCents(item.subtotalCents, item.currency)
                      : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    {item.taxCents != null
                      ? formatMoneyFromCents(item.taxCents, item.currency)
                      : "—"}
                  </td>
                  <td className="py-3 pr-4 font-medium text-foreground">
                    {item.totalCents != null
                      ? formatMoneyFromCents(item.totalCents, item.currency)
                      : "—"}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-muted">
                    {item.invoiceNumber
                      ? shortenRef(item.invoiceNumber)
                      : shortenRef(item.providerTransactionId)}
                  </td>
                  <td className="py-3">
                    {canManage && item.hasPdfAvailable ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isPending && pdfPendingId === item.providerTransactionId}
                        loading={isPending && pdfPendingId === item.providerTransactionId}
                        onClick={() => openPdf(item.providerTransactionId)}
                      >
                        Download PDF
                      </Button>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canManage && hasMore ? (
        <div className="mt-4">
          <Button type="button" variant="secondary" disabled={isPending} onClick={loadMore}>
            Load more
          </Button>
        </div>
      ) : null}
    </PageSurface>
  );
}
