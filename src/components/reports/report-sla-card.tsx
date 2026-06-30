type ReportSlaCardProps = {
  slaScore: number | null;
  violations?: number;
};

export function ReportSlaCard({ slaScore, violations = 0 }: ReportSlaCardProps) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wider text-muted">SLA compliance</p>
      <p className="mt-2 text-3xl font-semibold text-foreground">
        {slaScore != null ? `${slaScore}%` : "—"}
      </p>
      <p className="mt-2 text-sm text-muted">
        {violations === 0 ? "No SLA breaches detected." : `${violations} breach${violations === 1 ? "" : "es"} detected.`}
      </p>
    </div>
  );
}
