import { StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import {
  getPipelineStageBadgeClass,
  getPipelineStageLabel,
} from "@/lib/sales/pipeline-stages";
import type { SalesPipelineStage } from "@/types/database";

type PipelineStageBadgeProps = {
  stage: SalesPipelineStage;
  className?: string;
};

/** Pipeline stage chip — shared StatusBadge chrome with stage-specific sales tones. */
export function PipelineStageBadge({ stage, className }: PipelineStageBadgeProps) {
  return (
    <StatusBadge tone="muted" className={cn(getPipelineStageBadgeClass(stage), className)}>
      {getPipelineStageLabel(stage)}
    </StatusBadge>
  );
}
