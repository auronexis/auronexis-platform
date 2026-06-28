import type { CustomerOnboardingRecord } from "@/types/database";

export const KICKOFF_WORKFLOW_STEPS = [
  "Schedule kickoff call",
  "Confirm stakeholders and goals",
  "Review pilot scope and timeline",
  "Assign customer success owner",
] as const;

export const CUSTOMER_ONBOARDING_CHECKLIST = [
  "Kickoff workflow complete",
  "Workspace created",
  "Onboarding checklist reviewed",
  "Team invited",
  "Integrations connected",
  "Initial diagnostics run",
  "Health baseline captured",
] as const;

export const ONBOARDING_CHECKLIST_TOTAL = CUSTOMER_ONBOARDING_CHECKLIST.length;

export function computeOnboardingHealthScore(
  checklistCompleted: number,
  workspaceCreated: boolean,
  diagnosticsBaseline: boolean,
): number {
  const progress = checklistCompleted / ONBOARDING_CHECKLIST_TOTAL;
  let score = Math.round(progress * 100);
  if (workspaceCreated) score = Math.min(100, score + 5);
  if (diagnosticsBaseline) score = Math.min(100, score + 5);
  return score;
}

export function summarizeOnboardingRecords(records: CustomerOnboardingRecord[]) {
  if (records.length === 0) {
    return { count: 0, inProgress: 0, complete: 0, avgHealth: 0 };
  }

  const complete = records.filter((r) => r.status === "complete").length;
  const avgHealth = Math.round(
    records.reduce((sum, r) => sum + r.health_baseline_score, 0) / records.length,
  );

  return {
    count: records.length,
    inProgress: records.length - complete,
    complete,
    avgHealth,
  };
}
