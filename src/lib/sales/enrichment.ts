import type { SalesLead } from "@/types/database";

export const ENRICHMENT_FIELDS = [
  "website",
  "linkedin_url",
  "employee_count",
  "location",
  "industry",
  "arr_estimate",
  "potential_mrr",
  "pain_score",
  "fit_score",
  "priority_score",
] as const;

export type EnrichmentInput = Pick<
  SalesLead,
  | "website"
  | "linkedin_url"
  | "employee_count"
  | "location"
  | "industry"
  | "pain_points"
  | "company_size"
  | "mrr_estimate"
  | "lead_value"
>;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function estimatePotentialMrr(input: EnrichmentInput): number {
  const explicit = Number(input.mrr_estimate ?? input.lead_value ?? 0);
  if (explicit > 0) return explicit;

  const employees = input.employee_count ?? 0;
  if (employees >= 200) return 799;
  if (employees >= 50) return 499;
  if (employees >= 10) return 299;
  return 149;
}

export function estimateArr(input: EnrichmentInput, potentialMrr: number): number {
  return potentialMrr * 12;
}

export function computePainScore(input: EnrichmentInput): number {
  let score = 40;
  if (input.pain_points && input.pain_points.length > 20) score += 25;
  if (input.pain_points && input.pain_points.length > 80) score += 15;
  if (!input.website) score += 5;
  return clampScore(score);
}

export function computeFitScore(input: EnrichmentInput): number {
  let score = 35;
  if (input.website) score += 15;
  if (input.linkedin_url) score += 10;
  if (input.industry) score += 15;
  if ((input.employee_count ?? 0) >= 5) score += 15;
  if (input.location) score += 10;
  return clampScore(score);
}

export function computePriorityScore(pain: number, fit: number, potentialMrr: number): number {
  const revenueWeight = potentialMrr >= 499 ? 20 : potentialMrr >= 299 ? 12 : 5;
  return clampScore(pain * 0.35 + fit * 0.45 + revenueWeight);
}

export function enrichLeadScores(input: EnrichmentInput) {
  const potentialMrr = estimatePotentialMrr(input);
  const arrEstimate = estimateArr(input, potentialMrr);
  const painScore = computePainScore(input);
  const fitScore = computeFitScore(input);
  const priorityScore = computePriorityScore(painScore, fitScore, potentialMrr);

  return {
    potential_mrr: potentialMrr,
    arr_estimate: arrEstimate,
    pain_score: painScore,
    fit_score: fitScore,
    priority_score: priorityScore,
  };
}
