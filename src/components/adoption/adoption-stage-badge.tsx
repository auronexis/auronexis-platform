import type { AdoptionStage } from "@/lib/adoption/types";
import { ADOPTION_STAGE_LABELS } from "@/lib/adoption/constants";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/badge";

const STAGE_TONES: Record<AdoptionStage, StatusBadgeTone> = {
  newly_activated: "info",
  early_adoption: "info",
  developing_habits: "warning",
  operational: "success",
  embedded: "neutral",
  at_risk: "danger",
  inactive: "muted",
};

type AdoptionStageBadgeProps = {
  stage: AdoptionStage;
  className?: string;
};

export function AdoptionStageBadge({ stage, className }: AdoptionStageBadgeProps) {
  return (
    <StatusBadge
      tone={STAGE_TONES[stage]}
      className={className}
      aria-label={`Adoption stage: ${ADOPTION_STAGE_LABELS[stage]}`}
    >
      {ADOPTION_STAGE_LABELS[stage]}
    </StatusBadge>
  );
}
