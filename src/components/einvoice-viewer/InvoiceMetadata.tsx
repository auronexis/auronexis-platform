import {
  formatCiiDate102,
  formatServicePeriodLabel,
} from "@/lib/einvoice-viewer/format";
import type { EInvoiceViewModel } from "@/lib/einvoice-viewer/types";

type InvoiceMetadataProps = {
  model: EInvoiceViewModel;
};

export function InvoiceMetadata({ model }: InvoiceMetadataProps) {
  const period = formatServicePeriodLabel(
    model.servicePeriod.start,
    model.servicePeriod.end,
  );
  const delivery = formatCiiDate102(model.servicePeriod.deliveryDate);

  return (
    <section className="rounded-md border border-border/80 bg-surface/40 px-4 py-3 text-sm print:border-0 print:bg-transparent print:px-0">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        Rechnungsdaten
      </h2>
      <ul className="mt-2 space-y-1 text-foreground">
        <li>
          <span className="text-muted">Nummer: </span>
          {model.invoiceNumber}
        </li>
        <li>
          <span className="text-muted">Datum: </span>
          {formatCiiDate102(model.issueDate) ?? "—"}
        </li>
        {period ? (
          <li>
            <span className="text-muted">Leistungszeitraum: </span>
            {period}
          </li>
        ) : null}
        {!period && delivery ? (
          <li>
            <span className="text-muted">Leistungsdatum: </span>
            {delivery}
          </li>
        ) : null}
        <li>
          <span className="text-muted">Währung: </span>
          {model.currency ?? "—"}
        </li>
      </ul>
    </section>
  );
}
