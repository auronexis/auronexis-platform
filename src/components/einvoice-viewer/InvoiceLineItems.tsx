import { formatXmlMoney } from "@/lib/einvoice-viewer/format";
import type { EInvoiceViewModel } from "@/lib/einvoice-viewer/types";

type InvoiceLineItemsProps = {
  model: EInvoiceViewModel;
};

export function InvoiceLineItems({ model }: InvoiceLineItemsProps) {
  const currency = model.currency;
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        Positionen
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="py-2 pr-3 font-medium">
                Pos.
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                Beschreibung
              </th>
              <th scope="col" className="py-2 pr-3 font-medium text-right">
                Menge
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                Einheit
              </th>
              <th scope="col" className="py-2 pr-3 font-medium text-right">
                Einzelpreis
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                Steuer
              </th>
              <th scope="col" className="py-2 font-medium text-right">
                Betrag
              </th>
            </tr>
          </thead>
          <tbody>
            {model.lines.map((line) => (
              <tr key={line.lineId} className="border-b border-border/70 align-top">
                <td className="py-3 pr-3 font-medium text-foreground">{line.lineId}</td>
                <td className="py-3 pr-3 text-foreground">{line.description}</td>
                <td className="py-3 pr-3 text-right tabular-nums text-foreground">
                  {line.quantity}
                </td>
                <td className="py-3 pr-3 text-foreground">
                  {line.unitLabel ?? line.unitCode ?? "—"}
                </td>
                <td className="py-3 pr-3 text-right tabular-nums text-foreground">
                  {formatXmlMoney(line.netUnitPrice, currency) ?? "—"}
                </td>
                <td className="py-3 pr-3 text-foreground">{line.taxLabel ?? "—"}</td>
                <td className="py-3 text-right tabular-nums font-medium text-foreground">
                  {formatXmlMoney(line.lineTotal, currency) ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
