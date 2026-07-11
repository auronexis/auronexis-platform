import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ExecutiveIntelligenceSnapshot } from "@/lib/executive-intelligence/types";

export type BriefingRow = {
  id: string;
  organization_id: string;
  period_key: string;
  period_start: string;
  period_end: string;
  comparison_start: string;
  comparison_end: string;
  snapshot: ExecutiveIntelligenceSnapshot;
  deterministic_narrative: string;
  ai_narrative: string | null;
  generated_by: string;
  generated_by_user_id: string | null;
  provider: string | null;
  model: string | null;
  status: string;
  error_code: string | null;
  created_at: string;
  updated_at: string;
};

export async function saveExecutiveBriefing(input: {
  organizationId: string;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  comparisonStart: string;
  comparisonEnd: string;
  snapshot: ExecutiveIntelligenceSnapshot;
  deterministicNarrative: string;
  aiNarrative: string | null;
  generatedBy: string;
  generatedByUserId: string | null;
  provider: string | null;
  model: string | null;
  status: string;
  errorCode?: string | null;
}): Promise<BriefingRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("executive_intelligence_briefings")
    .insert({
      organization_id: input.organizationId,
      period_key: input.periodKey,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      comparison_start: input.comparisonStart,
      comparison_end: input.comparisonEnd,
      snapshot: input.snapshot as never,
      deterministic_narrative: input.deterministicNarrative,
      ai_narrative: input.aiNarrative,
      generated_by: input.generatedBy,
      generated_by_user_id: input.generatedByUserId,
      provider: input.provider,
      model: input.model,
      status: input.status,
      error_code: input.errorCode ?? null,
    } as never)
    .select("*")
    .single();

  if (error) {
    console.warn("[executive-intelligence] save briefing failed:", {
      operation: "saveExecutiveBriefing",
      organization_id: input.organizationId,
      message: error.message,
      code: error.code,
    });
    return null;
  }

  return data as BriefingRow;
}

export async function listRecentBriefings(
  organizationId: string,
  limit = 5,
): Promise<BriefingRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("executive_intelligence_briefings")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as BriefingRow[];
}
