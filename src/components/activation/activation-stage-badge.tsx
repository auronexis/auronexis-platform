import type { ActivationStage } from "@/lib/activation/types";
import { cn } from "@/lib/utils/cn";

const STAGE_LABELS: Record<ActivationStage, string> = {
  not_started: "Not started",
  getting_started: "Getting started",
  building_foundation: "Building foundation",
  operational: "Operational",
  activated: "Activated",
  mature: "Mature workspace",
};

const STAGE_TONES: Record<ActivationStage, string> = {
  not_started: "bg-muted/15 text-muted border-border",
  getting_started: "bg-primary/10 text-primary border-primary/20",
  building_foundation: "bg-info/10 text-info border-info/20",
  operational: "bg-warning/10 text-warning border-warning/20",
  activated: "bg-success/10 text-success border-success/20",
  mature: "bg-muted/10 text-foreground border-border",
};

type ActivationStageBadgeProps = {
  stage: ActivationStage;
  className?: string;
};

export function ActivationStageBadge({ stage, className }: ActivationStageBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        STAGE_TONES[stage],
        className,
      )}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}

export function getActivationStageLabel(stage: ActivationStage): string {
  return STAGE_LABELS[stage];
}
