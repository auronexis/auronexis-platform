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

export function PipelineStageBadge({ stage, className }: PipelineStageBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        getPipelineStageBadgeClass(stage),
        className,
      )}
    >
      {getPipelineStageLabel(stage)}
    </span>
  );
}
