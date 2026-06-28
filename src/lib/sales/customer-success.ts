import type { CustomerSuccessRecord } from "@/types/database";

export const PILOT_ONBOARDING_CHECKLIST = [
  "Workspace provisioned",
  "Admin users invited",
  "First client imported",
  "Risk register configured",
  "Incident workflow tested",
  "First report generated",
  "Portal access enabled",
  "Kickoff feedback captured",
] as const;

export const CUSTOMER_SUCCESS_MILESTONES_TOTAL = PILOT_ONBOARDING_CHECKLIST.length;

export type CustomerSuccessScores = {
  adoption_score: number;
  usage_score: number;
  success_score: number;
  risk_score: number;
  renewal_probability: number;
};

export function computeCustomerSuccessScores(
  milestonesCompleted: number,
  onboardingComplete: boolean,
): CustomerSuccessScores {
  const progress = milestonesCompleted / CUSTOMER_SUCCESS_MILESTONES_TOTAL;
  const adoption = Math.round(progress * 100);
  const usage = Math.round(Math.min(100, adoption + (onboardingComplete ? 15 : 0)));
  const success = Math.round(adoption * 0.5 + usage * 0.5);
  const risk = Math.max(0, 100 - success);
  const renewal = Math.round(Math.min(100, success * 0.85 + (onboardingComplete ? 10 : 0)));

  return {
    adoption_score: adoption,
    usage_score: usage,
    success_score: success,
    risk_score: risk,
    renewal_probability: renewal,
  };
}

export function summarizeCustomerSuccess(records: CustomerSuccessRecord[]) {
  if (records.length === 0) {
    return {
      count: 0,
      avgAdoption: 0,
      avgUsage: 0,
      avgSuccess: 0,
      avgRisk: 0,
      avgRenewal: 0,
      onboardingComplete: 0,
    };
  }

  const sum = records.reduce(
    (acc, row) => ({
      adoption: acc.adoption + row.adoption_score,
      usage: acc.usage + row.usage_score,
      success: acc.success + row.success_score,
      risk: acc.risk + row.risk_score,
      renewal: acc.renewal + row.renewal_probability,
      onboarded: acc.onboarded + (row.onboarding_complete ? 1 : 0),
    }),
    { adoption: 0, usage: 0, success: 0, risk: 0, renewal: 0, onboarded: 0 },
  );

  const count = records.length;
  return {
    count,
    avgAdoption: Math.round(sum.adoption / count),
    avgUsage: Math.round(sum.usage / count),
    avgSuccess: Math.round(sum.success / count),
    avgRisk: Math.round(sum.risk / count),
    avgRenewal: Math.round(sum.renewal / count),
    onboardingComplete: sum.onboarded,
  };
}
