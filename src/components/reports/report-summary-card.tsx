import type { ReportSummary } from "@/lib/reports-v2/types";

type ReportSummaryCardProps = {
  summary: string | null;
  executiveSummary?: string | null;
  metrics?: ReportSummary["metrics"] | null;
};

export function ReportSummaryCard({
  summary,
  executiveSummary,
  metrics,
}: ReportSummaryCardProps) {
  const text = summary ?? executiveSummary;

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Summary</h3>
      <p className="mt-3 text-sm leading-relaxed text-foreground">
        {text ?? "Generate this report to produce an executive summary."}
      </p>
      {metrics ? (
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">Health</dt>
            <dd className="text-lg font-semibold">{metrics.healthScore ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">SLA</dt>
            <dd className="text-lg font-semibold">
              {metrics.slaScore != null ? `${metrics.slaScore}%` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Open risks</dt>
            <dd className="text-lg font-semibold">{metrics.openRisks}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Activity</dt>
            <dd className="text-lg font-semibold">{metrics.activityCount}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
