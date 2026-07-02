type ExecutiveMetricsProps = {
  riskSummary: string | null;
  incidentSummary: string | null;
  slaSummary: string | null;
  monitoringSummary: string | null;
  aiSummary: string | null;
};

function MetricBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</h4>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {value ?? "—"}
      </p>
    </div>
  );
}

export function ExecutiveMetrics({
  riskSummary,
  incidentSummary,
  slaSummary,
  monitoringSummary,
  aiSummary,
}: ExecutiveMetricsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <MetricBlock label="Risk summary" value={riskSummary} />
      <MetricBlock label="Incident summary" value={incidentSummary} />
      <MetricBlock label="SLA summary" value={slaSummary} />
      <MetricBlock label="Monitoring summary" value={monitoringSummary} />
      <MetricBlock label="AI insights" value={aiSummary} />
    </div>
  );
}
