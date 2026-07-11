import type { IntelligenceEvidence, IntelligenceSourceType } from "@/lib/executive-intelligence/types";

export function buildEvidence(input: {
  sourceType: IntelligenceSourceType;
  sourceKey: string;
  label: string;
  value: string | number | boolean | null;
  observedAt?: string | null;
  route?: string | null;
}): IntelligenceEvidence {
  return {
    sourceType: input.sourceType,
    sourceKey: input.sourceKey,
    label: input.label,
    value: input.value,
    observedAt: input.observedAt ?? null,
    route: input.route ?? null,
  };
}

export function evidenceKey(evidence: IntelligenceEvidence): string {
  return `${evidence.sourceType}:${evidence.sourceKey}`;
}

export function collectEvidenceKeys(items: IntelligenceEvidence[]): Set<string> {
  return new Set(items.map(evidenceKey));
}
