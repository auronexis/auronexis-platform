import { formatXmlMoney, formatXmlPercent } from "@/lib/einvoice-viewer/format";
import type { EInvoiceViewModel } from "@/lib/einvoice-viewer/types";

type InvoiceTotalsProps = {
  model: EInvoiceViewModel;
};

export function InvoiceTotals({ model }: InvoiceTotalsProps) {
  const currency = model.currency;
  const primaryTax = model.taxes[0];
  const vatLabel =
    primaryTax?.categoryCode.toUpperCase() === "S"
      ? `USt. ${formatXmlPercent(primaryTax.ratePercent) ?? ""}`.trim()
      : "Umsatzsteuer";

  return (
    <section className="ml-auto w-full max-w-sm">
      <h2 className="sr-only">Summen</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-6">
          <dt className="text-muted">Nettobetrag</dt>
          <dd className="tabular-nums font-medium text-foreground">
            {formatXmlMoney(model.totals.taxBasisTotalAmount ?? model.totals.lineTotalAmount, currency) ??
              "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className="text-muted">{vatLabel}</dt>
          <dd className="tabular-nums font-medium text-foreground">
            {formatXmlMoney(model.totals.taxTotalAmount, currency) ?? "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-6 border-t border-border pt-2 text-base">
          <dt className="font-semibold text-foreground">Gesamtbetrag</dt>
          <dd className="tabular-nums font-semibold text-foreground">
            {formatXmlMoney(model.totals.grandTotalAmount, currency) ?? "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className="text-muted">Zu zahlender Betrag</dt>
          <dd className="tabular-nums font-medium text-foreground">
            {formatXmlMoney(model.totals.duePayableAmount, currency) ?? "—"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
