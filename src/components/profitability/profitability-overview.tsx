import Link from "next/link";
import { ClientHealthBadge } from "@/components/profitability/client-health-badge";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import { auroraSurfaceElevated } from "@/lib/ui/aurora";
import type { ClientProfitabilityRow, ProfitabilitySummary } from "@/lib/profitability/types";
import { formatCurrency, formatMargin } from "@/lib/profitability/types";
import { linkText } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";

type ProfitabilityOverviewProps = {
  summary: ProfitabilitySummary;
  topClients: ClientProfitabilityRow[];
  mostProfitableClients: ClientProfitabilityRow[];
  needsAttention: ClientProfitabilityRow[];
};

function ClientMiniList({
  title,
  rows,
  valueLabel,
  getValue,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  rows: ClientProfitabilityRow[];
  valueLabel: string;
  getValue: (row: ClientProfitabilityRow) => string;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <PageSurface>
      <PageSurfaceHeading title={title} />
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-foreground">{emptyTitle}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{emptyDescription}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.clientId}
              className="flex items-center justify-between gap-4 border-b border-border/60 pb-3 last:border-b-0 last:pb-0"
            >
              <div>
                <Link
                  href={`/clients/${row.clientId}`}
                  className={cn(linkText, "font-semibold no-underline hover:underline")}
                >
                  {row.clientName}
                </Link>
                <p className="mt-1 text-xs text-muted">
                  {valueLabel}: {getValue(row)}
                </p>
              </div>
              <ClientHealthBadge health={row.health} />
            </li>
          ))}
        </ul>
      )}
    </PageSurface>
  );
}

export function ProfitabilityOverview({
  summary,
  topClients,
  mostProfitableClients,
  needsAttention,
}: ProfitabilityOverviewProps) {
  const kpis = [
    ["Monthly Revenue", formatCurrency(summary.monthlyRevenue)],
    ["Monthly Cost", formatCurrency(summary.monthlyCost)],
    ["Monthly Profit", formatCurrency(summary.monthlyProfit)],
    ["Average Margin", formatMargin(summary.averageMargin)],
  ] as const;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, value]) => (
          <div key={label} className={cn(auroraSurfaceElevated, "p-6")}>
            <p className="text-sm font-medium text-muted">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ClientMiniList
          title="Top Clients"
          rows={topClients}
          valueLabel="Revenue"
          getValue={(row) => formatCurrency(row.monthlyRevenue)}
          emptyTitle="No revenue data yet"
          emptyDescription="Add clients and financial details to see your highest-value accounts."
        />
        <ClientMiniList
          title="Most Profitable Clients"
          rows={mostProfitableClients}
          valueLabel="Profit"
          getValue={(row) => formatCurrency(row.profit)}
          emptyTitle="No profitability data yet"
          emptyDescription="Track client costs and revenue to surface your strongest margins."
        />
      </div>

      <PageSurface>
        <PageSurfaceHeading
          title="Needs Attention"
          description="Clients with Watch or Critical operational health."
        />
        {needsAttention.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-6 text-center">
            <p className="text-sm font-semibold text-foreground">Everything looks healthy</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              No clients currently need margin or health intervention.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {needsAttention.map((row) => (
              <li
                key={row.clientId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/5 px-4 py-3"
              >
                <div>
                  <Link
                    href={`/clients/${row.clientId}`}
                    className={cn(linkText, "font-semibold no-underline hover:underline")}
                  >
                    {row.clientName}
                  </Link>
                  <p className="mt-1 text-sm text-muted">
                    Margin {formatMargin(row.margin)} · Profit {formatCurrency(row.profit)}
                  </p>
                </div>
                <ClientHealthBadge health={row.health} />
              </li>
            ))}
          </ul>
        )}
      </PageSurface>
    </div>
  );
}
