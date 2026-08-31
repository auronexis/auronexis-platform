import {
  documentTypeLabel,
  formatCiiDate102,
  formatServicePeriodLabel,
} from "@/lib/einvoice-viewer/format";
import type { EInvoiceViewModel } from "@/lib/einvoice-viewer/types";

type InvoiceHeaderProps = {
  model: EInvoiceViewModel;
};

export function InvoiceHeader({ model }: InvoiceHeaderProps) {
  const period = formatServicePeriodLabel(
    model.servicePeriod.start,
    model.servicePeriod.end,
  );
  const delivery = formatCiiDate102(model.servicePeriod.deliveryDate);
  const typeLabel = documentTypeLabel(model.documentTypeCode);

  return (
    <header className="border-b border-border pb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        Auroranexis AI Solutions
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
        E-Rechnung
      </h1>
      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Rechnungsnummer</dt>
          <dd className="font-medium text-foreground">{model.invoiceNumber}</dd>
        </div>
        <div>
          <dt className="text-muted">Rechnungsdatum</dt>
          <dd className="font-medium text-foreground">
            {formatCiiDate102(model.issueDate) ?? "—"}
          </dd>
        </div>
        {period ? (
          <div>
            <dt className="text-muted">Leistungszeitraum</dt>
            <dd className="font-medium text-foreground">{period}</dd>
          </div>
        ) : delivery ? (
          <div>
            <dt className="text-muted">Leistungsdatum</dt>
            <dd className="font-medium text-foreground">{delivery}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-muted">Währung</dt>
          <dd className="font-medium text-foreground">{model.currency ?? "—"}</dd>
        </div>
        {typeLabel ? (
          <div>
            <dt className="text-muted">Dokumenttyp</dt>
            <dd className="font-medium text-foreground">{typeLabel}</dd>
          </div>
        ) : null}
      </dl>
    </header>
  );
}
