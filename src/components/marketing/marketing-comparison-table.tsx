import { cn } from "@/lib/utils/cn";

export type MarketingComparisonRow = {
  feature: string;
  starter?: string | boolean;
  professional?: string | boolean;
  business?: string | boolean;
  enterprise?: string | boolean;
};

type MarketingComparisonTableProps = {
  rows: readonly MarketingComparisonRow[];
  className?: string;
};

function formatCell(value: string | boolean | undefined): string {
  if (value === undefined) return "—";
  if (typeof value === "boolean") return value ? "✓" : "—";
  return value;
}

/** Plan comparison table — accessible, responsive scroll on mobile. */
export function MarketingComparisonTable({ rows, className }: MarketingComparisonTableProps) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-white/10", className)}>
      <table className="min-w-[640px] w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.04]">
            <th scope="col" className="px-4 py-3 font-semibold text-white">
              Capability
            </th>
            <th scope="col" className="px-4 py-3 font-semibold text-white">
              Professional
            </th>
            <th scope="col" className="px-4 py-3 font-semibold text-white">
              Business
            </th>
            <th scope="col" className="px-4 py-3 font-semibold text-white">
              Enterprise
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="border-b border-white/5 last:border-0">
              <th scope="row" className="px-4 py-3 font-medium text-primary-foreground/90">
                {row.feature}
              </th>
              <td className="px-4 py-3 text-primary-foreground/75">
                {formatCell(row.professional ?? row.starter)}
              </td>
              <td className="px-4 py-3 text-primary-foreground/75">{formatCell(row.business)}</td>
              <td className="px-4 py-3 text-primary-foreground/75">{formatCell(row.enterprise)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
