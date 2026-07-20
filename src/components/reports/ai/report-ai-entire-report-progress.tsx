import { SkeletonText } from "@/components/ui/skeleton";
import type { EntireReportProgress } from "@/lib/ai/types";

type ReportAIEntireReportProgressProps = {
  progress: EntireReportProgress;
};

export function ReportAIEntireReportProgress({ progress }: ReportAIEntireReportProgressProps) {
  if (!progress.active && !progress.complete) {
    return null;
  }

  const percent = progress.totalSteps
    ? Math.round((progress.currentStep / progress.totalSteps) * 100)
    : 0;

  return (
    <section
      aria-label="Entire report generation progress"
      className="rounded-lg border border-border bg-surface/80 p-4"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          {progress.complete ? "Complete" : "Generating entire report"}
        </p>
        {!progress.complete ? (
          <span className="text-xs text-muted">
            {progress.currentStep}/{progress.totalSteps}
          </span>
        ) : null}
      </div>

      {!progress.complete ? (
        <>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-muted/15"
            role="progressbar"
            aria-valuenow={progress.currentStep}
            aria-valuemin={0}
            aria-valuemax={progress.totalSteps}
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted">{progress.currentLabel}…</p>
          <SkeletonText lines={3} className="mt-3" />
        </>
      ) : (
        <p className="mt-2 text-xs text-success">All sections generated — review and apply below.</p>
      )}
    </section>
  );
}
