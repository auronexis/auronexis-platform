"use client";

import { HelpCircle } from "lucide-react";
import { ClientHealthScore } from "@/components/clients/client-health-score";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";

const HEALTH_SCORE_HELP =
  "Calculated from incidents, open risks, SLA compliance, report delivery, engagement signals, and recent activity.";

type ClientHealthScoreWithTooltipProps = {
  score: number | null | undefined;
  className?: string;
  showHelp?: boolean;
};

export function ClientHealthScoreWithTooltip({
  score,
  className,
  showHelp = true,
}: ClientHealthScoreWithTooltipProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <ClientHealthScore score={score} />
      {showHelp ? (
        <Tooltip content={HEALTH_SCORE_HELP} side="top">
          <button
            type="button"
            className="inline-flex text-muted hover:text-foreground"
            aria-label="How health score is calculated"
          >
            <HelpCircle className="h-4 w-4" aria-hidden />
          </button>
        </Tooltip>
      ) : null}
    </span>
  );
}
