/** Phase 8 Sprint 0 — launch sales execution targets. */
export const LAUNCH_EXECUTION_TARGETS = {
  outreach: 20,
  discoveryCalls: 5,
  pilots: 2,
  customers: 1,
} as const;

export type LaunchExecutionTargetKey = keyof typeof LAUNCH_EXECUTION_TARGETS;

export const LAUNCH_EXECUTION_TARGET_LABELS: Record<LaunchExecutionTargetKey, string> = {
  outreach: "Outreach sent",
  discoveryCalls: "Discovery calls",
  pilots: "Pilots",
  customers: "Customers",
};

export function computeLaunchTargetProgress(
  actual: Record<LaunchExecutionTargetKey, number>,
): { overallPercent: number; met: LaunchExecutionTargetKey[]; pending: LaunchExecutionTargetKey[] } {
  const keys = Object.keys(LAUNCH_EXECUTION_TARGETS) as LaunchExecutionTargetKey[];
  const met = keys.filter((key) => actual[key] >= LAUNCH_EXECUTION_TARGETS[key]);
  const pending = keys.filter((key) => actual[key] < LAUNCH_EXECUTION_TARGETS[key]);
  const ratios = keys.map((key) =>
    Math.min(1, actual[key] / LAUNCH_EXECUTION_TARGETS[key]),
  );
  const overallPercent = Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100);
  return { overallPercent, met, pending };
}
