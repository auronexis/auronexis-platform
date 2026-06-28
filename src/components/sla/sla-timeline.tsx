import { formatSlaDueDate } from "@/lib/sla/calculations";
import type { EntitySlaInfo } from "@/lib/sla/types";
import { cn } from "@/lib/utils/cn";

type SlaTimelineStep = {
  key: string;
  label: string;
  timestamp: string | null;
  state: "complete" | "current" | "upcoming" | "inactive";
};

function buildTimelineSteps(sla: EntitySlaInfo): SlaTimelineStep[] {
  const status = sla.status;
  const isClosed = Boolean(sla.resolvedAt);

  const warningState: SlaTimelineStep["state"] =
    status === "warning"
      ? "current"
      : status === "breached" || isClosed
        ? "complete"
        : status === "on_track"
          ? "upcoming"
          : "inactive";

  const breachedState: SlaTimelineStep["state"] =
    status === "breached"
      ? "current"
      : isClosed
        ? "complete"
        : status === "warning" || status === "on_track"
          ? "upcoming"
          : "inactive";

  const resolvedState: SlaTimelineStep["state"] = isClosed ? "complete" : "upcoming";

  return [
    {
      key: "created",
      label: "Created",
      timestamp: sla.createdAt,
      state: "complete",
    },
    {
      key: "warning",
      label: "Warning",
      timestamp: sla.warningAt,
      state: warningState,
    },
    {
      key: "breached",
      label: "Breached",
      timestamp: sla.slaDueAt,
      state: breachedState,
    },
    {
      key: "resolved",
      label: "Resolved",
      timestamp: sla.resolvedAt,
      state: resolvedState,
    },
  ];
}

const dotStyles: Record<SlaTimelineStep["state"], string> = {
  complete: "border-success bg-green-50 text-success",
  current: "border-warning bg-amber-50 text-warning ring-4 ring-amber-100",
  upcoming: "border-border bg-surface-1 text-muted",
  inactive: "border-border bg-muted/10 text-muted",
};

const lineStyles: Record<SlaTimelineStep["state"], string> = {
  complete: "bg-success/40",
  current: "bg-amber-200",
  upcoming: "bg-border",
  inactive: "bg-muted/10",
};

type SlaTimelineProps = {
  sla: EntitySlaInfo;
};

export function SlaTimeline({ sla }: SlaTimelineProps) {
  const steps = buildTimelineSteps(sla);

  return (
    <div className="mt-8 border-t border-border pt-6">
      <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
        SLA timeline
      </h3>
      <ol className="mt-5 space-y-0">
        {steps.map((step, index) => (
          <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
            {index < steps.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[11px] top-6 h-[calc(100%-8px)] w-0.5",
                  lineStyles[step.state],
                )}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                dotStyles[step.state],
              )}
            >
              {index + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.state === "inactive" ? "text-muted" : "text-navy-950",
                )}
              >
                {step.label}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {step.timestamp ? formatSlaDueDate(step.timestamp) : "Pending"}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
