import type { FirstCustomerMetrics } from "@/lib/sales/execution-metrics";

export function FirstCustomerMetricsCard({ metrics }: { metrics: FirstCustomerMetrics }) {
  const items = [
    { label: "Time to close", value: metrics.timeToCloseDays ? `${metrics.timeToCloseDays} days` : "—" },
    { label: "Pilot conversion", value: `${metrics.pilotConversion}%` },
    { label: "Average deal size", value: `$${metrics.averageDealSize.toLocaleString()}` },
    { label: "Revenue forecast", value: `$${metrics.revenueForecast.toLocaleString()}` },
    { label: "Customer satisfaction", value: metrics.customerSatisfaction ? `${metrics.customerSatisfaction}%` : "—" },
  ];

  return (
    <section className="aurora-surface p-5">
      <h2 className="text-base font-semibold text-foreground">First customer metrics</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs uppercase tracking-wider text-muted">{item.label}</dt>
            <dd className="text-lg font-semibold text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
