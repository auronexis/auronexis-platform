import type { SlaMonthlyTrendPoint } from "@/lib/sla/types";
import { cn } from "@/lib/utils/cn";

type SLAComplianceChartProps = {
  points: SlaMonthlyTrendPoint[];
  className?: string;
};

export function SLAComplianceChart({ points, className }: SLAComplianceChartProps) {
  if (points.length === 0) {
    return (
      <div className={cn("rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-8 text-center text-sm text-muted", className)}>
        Monthly compliance trend will appear after SLA events are recorded.
      </div>
    );
  }

  const max = 100;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex h-40 items-end gap-3">
        {points.map((point) => (
          <div key={point.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-32 w-full items-end rounded-md bg-muted/10 px-1 pb-1">
              <div
                className="w-full rounded-sm bg-success/70"
                style={{ height: `${Math.max(8, (point.compliancePercent / max) * 100)}%` }}
                title={`${point.compliancePercent}%`}
              />
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
              {point.month.slice(5)}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">Monthly SLA compliance trend (%)</p>
    </div>
  );
}
