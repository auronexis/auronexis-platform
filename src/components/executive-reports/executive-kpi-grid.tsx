import type { ExecutiveReportMetadata } from "@/lib/executive-reports/types";
import { cn } from "@/lib/utils/cn";

type ExecutiveKPIGridProps = {
  metadata: ExecutiveReportMetadata;
};

function KpiCell({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: "green" | "blue" | "amber" | "slate";
}) {
  const toneStyles = {
    green: "border-success/20 bg-success/10 text-success",
    blue: "border-primary/20 bg-primary/10 text-primary",
    amber: "border-warning/20 bg-warning/10 text-warning",
    slate: "border-border bg-muted/10 text-foreground",
  } as const;

  return (
    <div className={cn("rounded-xl border px-4 py-3", toneStyles[tone])}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export function ExecutiveKPIGrid({ metadata }: ExecutiveKPIGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <KpiCell
        label="Health score"
        value={metadata.healthScore ?? "—"}
        tone="blue"
      />
      <KpiCell
        label="SLA compliance"
        value={metadata.slaScore != null ? `${metadata.slaScore}%` : "—"}
        tone="green"
      />
      <KpiCell
        label="Compliance readiness"
        value={metadata.complianceScore != null ? `${metadata.complianceScore}%` : "—"}
        tone="amber"
      />
      <KpiCell label="Open risks" value={metadata.openRisks ?? "—"} />
      <KpiCell label="Open incidents" value={metadata.openIncidents ?? "—"} />
      <KpiCell
        label="AI confidence"
        value={
          metadata.averageConfidence != null
            ? `${Math.round(metadata.averageConfidence * 100)}%`
            : "—"
        }
      />
    </div>
  );
}
