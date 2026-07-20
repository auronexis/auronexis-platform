import type { ActivationStage } from "@/lib/activation/types";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/badge";

const STAGE_LABELS: Record<ActivationStage, string> = {
  not_started: "Not started",
  getting_started: "Getting started",
  building_foundation: "Building foundation",
  operational: "Operational",
  activated: "Activated",
  mature: "Mature workspace",
};

const STAGE_TONES: Record<ActivationStage, StatusBadgeTone> = {
  not_started: "muted",
  getting_started: "info",
  building_foundation: "info",
  operational: "warning",
  activated: "success",
  mature: "neutral",
};

type ActivationStageBadgeProps = {
  stage: ActivationStage;
  className?: string;
};

export function ActivationStageBadge({ stage, className }: ActivationStageBadgeProps) {
  return (
    <StatusBadge tone={STAGE_TONES[stage]} className={className}>
      {STAGE_LABELS[stage]}
    </StatusBadge>
  );
}

export function getActivationStageLabel(stage: ActivationStage): string {
  return STAGE_LABELS[stage];
}
