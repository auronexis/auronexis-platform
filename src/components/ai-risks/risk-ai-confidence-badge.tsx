import { confidenceLabel } from "@/lib/ai-risks/types";
import { AIConfidenceBadge } from "@/components/ai/ai-confidence-badge";

type RiskAIConfidenceBadgeProps = {
  confidence: number | null | undefined;
  className?: string;
};

export function RiskAIConfidenceBadge({ confidence, className }: RiskAIConfidenceBadgeProps) {
  return (
    <AIConfidenceBadge
      confidence={confidence}
      label={confidenceLabel(confidence)}
      className={className}
    />
  );
}
