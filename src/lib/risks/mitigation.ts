/**
 * Mitigation rate for the Risk Center: share of risks that are mitigated or resolved.
 *
 * `openCount` already includes risks in the `mitigated` status (they stay open until resolved),
 * so mitigated risks are counted once. Resolved risks count as mitigated.
 */
export function computeRiskMitigationRate(input: {
  openCount: number;
  mitigatedOpenCount: number;
  resolvedCount: number;
}): number {
  const denominator = input.openCount + input.resolvedCount;
  if (denominator <= 0) {
    return 0;
  }
  return Math.round(((input.mitigatedOpenCount + input.resolvedCount) / denominator) * 100);
}
