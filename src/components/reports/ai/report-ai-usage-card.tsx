"use client";

import { AIUpgradeCard, AIUsageCard } from "@/components/ai/ai-usage-card";
import type { AIUsageSummary } from "@/lib/ai/types";
import { cn } from "@/lib/utils/cn";

type ReportAIUsageCardProps = {
  usageSummary: AIUsageSummary;
  averageLatencyMs?: number | null;
  className?: string;
};

/** @deprecated Use AIUsageCard from @/components/ai */
export function ReportAIUsageCard(props: ReportAIUsageCardProps) {
  return <AIUsageCard {...props} />;
}

type ReportAIUpgradeCardProps = {
  message: string;
  requiredPlanLabel?: string;
  className?: string;
  title?: string;
};

/** @deprecated Use AIUpgradeCard from @/components/ai */
export function ReportAIUpgradeCard({
  message,
  requiredPlanLabel,
  className,
  title = "AI Assistant",
}: ReportAIUpgradeCardProps) {
  return (
    <AIUpgradeCard
      title={title}
      message={message}
      requiredPlanLabel={requiredPlanLabel}
      className={cn(className)}
    />
  );
}

export { AIUsageCard, AIUpgradeCard };
