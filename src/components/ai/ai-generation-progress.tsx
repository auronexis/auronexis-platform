import { cn } from "@/lib/utils/cn";

export type AIGenerationPhase = "idle" | "preparing" | "generating" | "validating" | "complete";

type AIGenerationProgressProps = {
  phase: AIGenerationPhase;
  streaming?: boolean;
  label?: string;
  className?: string;
};

const PHASE_LABELS: Record<AIGenerationPhase, string> = {
  idle: "Ready",
  preparing: "Preparing context",
  generating: "Generating",
  validating: "Validating",
  complete: "Complete",
};

const PHASE_ORDER: AIGenerationPhase[] = [
  "preparing",
  "generating",
  "validating",
  "complete",
];

/** Unified loading UX for all AI panels. */
export function AIGenerationProgress({
  phase,
  streaming = false,
  label,
  className,
}: AIGenerationProgressProps) {
  if (phase === "idle") return null;

  const activeIndex = PHASE_ORDER.indexOf(phase);

  return (
    <div
      className={cn("space-y-3 rounded-lg border border-border bg-muted/5 p-4", className)}
      role="status"
      aria-live="polite"
      aria-busy={phase !== "complete"}
    >
      <p className="text-sm font-medium text-foreground">
        {label ?? (streaming && phase === "generating" ? "Generating…" : PHASE_LABELS[phase])}
      </p>
      <ol className="space-y-2" aria-label="Generation progress">
        {PHASE_ORDER.map((step, index) => {
          const isActive = step === phase;
          const isComplete = activeIndex > index;
          return (
            <li
              key={step}
              className={cn(
                "flex items-center gap-2 text-xs",
                isComplete ? "text-success" : isActive ? "text-foreground" : "text-muted",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-2 w-2 rounded-full",
                  isComplete ? "bg-success" : isActive ? "bg-primary animate-pulse motion-reduce:animate-none" : "bg-muted/40",
                )}
                aria-hidden
              />
              {PHASE_LABELS[step]}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
