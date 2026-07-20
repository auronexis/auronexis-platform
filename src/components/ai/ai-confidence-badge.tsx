import { StatusBadge, type StatusBadgeTone } from "@/components/ui/badge";

type AIConfidenceBadgeProps = {
  confidence: number | null | undefined;
  label: string;
  className?: string;
};

function resolveTone(confidence: number | null | undefined): StatusBadgeTone {
  if (confidence != null && confidence >= 0.85) return "success";
  if (confidence != null && confidence >= 0.65) return "warning";
  return "muted";
}

/** Shared AI confidence pill for risk and incident analysis surfaces. */
export function AIConfidenceBadge({ confidence, label, className }: AIConfidenceBadgeProps) {
  return (
    <StatusBadge tone={resolveTone(confidence)} className={className}>
      {label} confidence
      {confidence != null ? ` (${Math.round(confidence * 100)}%)` : ""}
    </StatusBadge>
  );
}
