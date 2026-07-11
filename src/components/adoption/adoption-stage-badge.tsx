import type { AdoptionStage } from "@/lib/adoption/types";
import { ADOPTION_STAGE_LABELS } from "@/lib/adoption/constants";
import { cn } from "@/lib/utils/cn";

const STAGE_TONES: Record<AdoptionStage, string> = {
  newly_activated: "bg-primary/10 text-primary border-primary/20",
  early_adoption: "bg-info/10 text-info border-info/20",
  developing_habits: "bg-warning/10 text-warning border-warning/20",
  operational: "bg-success/10 text-success border-success/20",
  embedded: "bg-muted/10 text-foreground border-border",
  at_risk: "bg-danger/10 text-danger border-danger/20",
  inactive: "bg-muted/15 text-muted border-border",
};

type AdoptionStageBadgeProps = {
  stage: AdoptionStage;
  className?: string;
};

export function AdoptionStageBadge({ stage, className }: AdoptionStageBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        STAGE_TONES[stage],
        className,
      )}
      aria-label={`Adoption stage: ${ADOPTION_STAGE_LABELS[stage]}`}
    >
      {ADOPTION_STAGE_LABELS[stage]}
    </span>
  );
}
