import { confidenceLabel } from "@/lib/ai-incidents/types";
import { AIConfidenceBadge } from "@/components/ai/ai-confidence-badge";

type IncidentAIConfidenceBadgeProps = {
  confidence: number | null | undefined;
  className?: string;
};

export function IncidentAIConfidenceBadge({ confidence, className }: IncidentAIConfidenceBadgeProps) {
  return (
    <AIConfidenceBadge
      confidence={confidence}
      label={confidenceLabel(confidence)}
      className={className}
    />
  );
}
