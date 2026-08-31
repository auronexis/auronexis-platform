import { formatXmlMoney, formatXmlPercent } from "@/lib/einvoice-viewer/format";
import type { EInvoiceViewModel } from "@/lib/einvoice-viewer/types";

type TaxSummaryProps = {
  model: EInvoiceViewModel;
};

export function TaxSummary({ model }: TaxSummaryProps) {
  const currency = model.currency;

  if (model.isReverseCharge) {
    const ae = model.taxes.find((t) => t.categoryCode.toUpperCase() === "AE");
    const reason =
      ae?.exemptionReason ??
      "Steuerschuldnerschaft des Leistungsempfängers";
    return (
      <section className="rounded-md border border-amber-700/30 bg-amber-50/80 px-4 py-4 dark:bg-amber-950/30 print:bg-transparent">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-900 dark:text-amber-200">
          Steuerbehandlung
        </h2>
        <p className="mt-2 text-lg font-semibold text-foreground">Reverse Charge</p>
        <p className="mt-1 text-sm text-foreground">{reason}</p>
        <p className="mt-3 text-sm text-foreground">
          Umsatzsteuer durch Auroranexis:{" "}
          <span className="font-medium tabular-nums">
            {formatXmlMoney(model.totals.taxTotalAmount, currency) ?? "0,00 €"}
          </span>
        </p>
        {model.taxes.length > 1 ? (
          <ul className="mt-3 space-y-1 text-sm text-muted">
            {model.taxes.map((tax, idx) => (
              <li key={`${tax.categoryCode}-${idx}`}>
                {tax.categoryCode}
                {tax.ratePercent ? ` · ${formatXmlPercent(tax.ratePercent)}` : ""}
                {tax.basisAmount
                  ? ` · Bemessungsgrundlage ${formatXmlMoney(tax.basisAmount, currency)}`
                  : ""}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    );
  }

  if (!model.hasStandardVat && model.taxes.length === 0) {
    return null;
  }

  return (
    <section className="rounded-md border border-border/80 px-4 py-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        Steuerbehandlung
      </h2>
      <ul className="mt-3 space-y-2 text-sm text-foreground">
        {model.taxes.map((tax, idx) => (
          <li key={`${tax.categoryCode}-${idx}`}>
            {tax.categoryCode.toUpperCase() === "S" ? (
              <>
                Umsatzsteuer {formatXmlPercent(tax.ratePercent) ?? ""}
                {tax.calculatedAmount
                  ? ` · ${formatXmlMoney(tax.calculatedAmount, currency)}`
                  : ""}
              </>
            ) : (
              <>
                Kategorie {tax.categoryCode}
                {tax.ratePercent ? ` · ${formatXmlPercent(tax.ratePercent)}` : ""}
                {tax.calculatedAmount
                  ? ` · ${formatXmlMoney(tax.calculatedAmount, currency)}`
                  : ""}
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
