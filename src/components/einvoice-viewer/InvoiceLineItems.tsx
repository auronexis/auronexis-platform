import { formatXmlMoney } from "@/lib/einvoice-viewer/format";
import type { EInvoiceViewModel } from "@/lib/einvoice-viewer/types";

type InvoiceLineItemsProps = {
  model: EInvoiceViewModel;
};

type LineItem = EInvoiceViewModel["lines"][number];

function formatUnit(line: LineItem): string {
  return line.unitLabel ?? line.unitCode ?? "—";
}

function formatUnitPrice(line: LineItem, currency: string | null): string {
  return formatXmlMoney(line.netUnitPrice, currency) ?? "—";
}

function formatLineTotal(line: LineItem, currency: string | null): string {
  return formatXmlMoney(line.lineTotal, currency) ?? "—";
}

function LineItemCard({ line, currency }: { line: LineItem; currency: string | null }) {
  return (
    <li className="rounded-md border border-border/70 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Pos. {line.lineId}
        </p>
        <p className="text-right text-sm font-medium tabular-nums text-foreground">
          {formatLineTotal(line, currency)}
        </p>
      </div>
      <p className="mt-2 break-words text-sm text-foreground">{line.description}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Menge</dt>
          <dd className="mt-0.5 tabular-nums text-foreground">{line.quantity}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Einheit</dt>
          <dd className="mt-0.5 text-foreground">{formatUnit(line)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Einzelpreis</dt>
          <dd className="mt-0.5 tabular-nums text-foreground">
            {formatUnitPrice(line, currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Steuer</dt>
          <dd className="mt-0.5 text-foreground">{line.taxLabel ?? "—"}</dd>
        </div>
      </dl>
    </li>
  );
}

export function InvoiceLineItems({ model }: InvoiceLineItemsProps) {
  const currency = model.currency;
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        Positionen
      </h2>

      <ul className="space-y-3 md:hidden print:hidden" aria-label="Positionen">
        {model.lines.map((line) => (
          <LineItemCard key={line.lineId} line={line} currency={currency} />
        ))}
      </ul>

      <table className="hidden w-full table-fixed border-collapse text-left text-sm md:table print:table">
        <colgroup>
          <col className="w-[3.25rem]" />
          <col />
          <col className="w-[4.5rem]" />
          <col className="w-[4.5rem]" />
          <col className="w-[6.5rem]" />
          <col className="w-[5.5rem]" />
          <col className="w-[6.5rem]" />
        </colgroup>
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th scope="col" className="py-2 pr-2 font-medium">
              Pos.
            </th>
            <th scope="col" className="py-2 pr-3 font-medium">
              Beschreibung
            </th>
            <th scope="col" className="py-2 pr-2 font-medium text-right">
              Menge
            </th>
            <th scope="col" className="py-2 pr-2 font-medium">
              Einheit
            </th>
            <th scope="col" className="py-2 pr-2 font-medium text-right">
              Einzelpreis
            </th>
            <th scope="col" className="py-2 pr-2 font-medium">
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
              <td className="py-3 pr-2 font-medium text-foreground">{line.lineId}</td>
              <td className="min-w-0 break-words py-3 pr-3 text-foreground">
                {line.description}
              </td>
              <td className="whitespace-nowrap py-3 pr-2 text-right tabular-nums text-foreground">
                {line.quantity}
              </td>
              <td className="whitespace-nowrap py-3 pr-2 text-foreground">
                {formatUnit(line)}
              </td>
              <td className="whitespace-nowrap py-3 pr-2 text-right tabular-nums text-foreground">
                {formatUnitPrice(line, currency)}
              </td>
              <td className="whitespace-nowrap py-3 pr-2 text-foreground">
                {line.taxLabel ?? "—"}
              </td>
              <td className="whitespace-nowrap py-3 text-right tabular-nums font-medium text-foreground">
                {formatLineTotal(line, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
