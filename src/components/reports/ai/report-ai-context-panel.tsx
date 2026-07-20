import type { ReportAIContextSnapshot } from "@/lib/ai/types";

type ReportAIContextPanelProps = {
  snapshot: ReportAIContextSnapshot | null;
};

export function ReportAIContextPanel({ snapshot }: ReportAIContextPanelProps) {
  if (!snapshot) {
    return (
      <section aria-label="AI context" className="rounded-lg border border-border bg-muted/5 p-4">
        <p className="text-sm font-medium text-foreground">Using</p>
        <p className="mt-2 text-xs text-muted">No context available.</p>
      </section>
    );
  }

  const items = [
    { label: "Client", value: snapshot.clientName || "—" },
    { label: "Period", value: snapshot.periodLabel || "—" },
    { label: "Risks", value: `${snapshot.openRisksCount} open (${snapshot.criticalRisksCount} critical)` },
    { label: "Incidents", value: `${snapshot.openIncidentsCount} open (${snapshot.criticalIncidentsCount} critical)` },
    { label: "SLA", value: `${snapshot.slaBreachesCount} breach${snapshot.slaBreachesCount === 1 ? "" : "es"}` },
    { label: "Profitability", value: snapshot.hasProfitability ? "Available" : "Not available" },
    { label: "Template", value: snapshot.hasTemplate ? "Linked" : "None" },
    { label: "Schedule", value: snapshot.hasSchedule ? "Linked" : "None" },
    { label: "Engineer", value: snapshot.assignedEngineer ?? "—" },
    { label: "Reviewer", value: snapshot.reviewer ?? "—" },
  ];

  return (
    <section aria-label="AI context" className="rounded-lg border border-border bg-muted/5 p-4">
      <p className="text-sm font-medium text-foreground">Using</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-muted">{item.label}</dt>
            <dd className="font-medium text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
      {!snapshot.hasPreviousReport ? (
        <p className="mt-3 text-xs text-muted">No previous reports.</p>
      ) : null}
    </section>
  );
}
