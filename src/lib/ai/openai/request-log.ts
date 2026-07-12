import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { OpenAIRequestLogInput } from "@/lib/ai/openai/types";

export async function recordOpenAIRequestLog(input: OpenAIRequestLogInput): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("ai_request_logs").insert({
    organization_id: input.organizationId,
    user_id: input.userId,
    client_id: input.clientId ?? null,
    report_id: input.reportId ?? null,
    provider: "openai",
    model: input.model,
    feature: input.feature,
    status: input.status,
    prompt_version: input.promptVersion ?? null,
    input_tokens: input.inputTokens ?? null,
    output_tokens: input.outputTokens ?? null,
    total_tokens: input.totalTokens ?? null,
    latency_ms: input.latencyMs ?? null,
    provider_request_id: input.providerRequestId ?? null,
    error_code: input.errorCode ?? null,
  } as never);

  if (error) {
    console.error("[openai] failed to record request log:", error.message);
  }
}

export async function countRecentOpenAIRequests(input: {
  organizationId: string;
  userId?: string;
  feature?: string;
  reportId?: string;
  sinceIso: string;
}): Promise<number> {
  const admin = createAdminClient();
  let query = admin
    .from("ai_request_logs")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", input.organizationId)
    .gte("created_at", input.sinceIso);

  if (input.userId) {
    query = query.eq("user_id", input.userId);
  }
  if (input.feature) {
    query = query.eq("feature", input.feature);
  }
  if (input.reportId) {
    query = query.eq("report_id", input.reportId);
  }

  const { count, error } = await query;
  if (error) {
    return 0;
  }
  return count ?? 0;
}

export async function hasActiveReportGeneration(reportId: string): Promise<boolean> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 2 * 60_000).toISOString();
  const { count, error } = await admin
    .from("ai_request_logs")
    .select("id", { count: "exact", head: true })
    .eq("report_id", reportId)
    .eq("feature", "executive_report_summary")
    .gte("created_at", since);

  if (error) {
    return false;
  }
  return (count ?? 0) > 0;
}

export async function getLatestOpenAIRequestForOrg(
  organizationId: string,
  feature?: string,
): Promise<{ createdAt: string; status: string } | null> {
  const admin = createAdminClient();
  let query = admin
    .from("ai_request_logs")
    .select("created_at, status")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (feature) {
    query = query.eq("feature", feature);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  const row = data as { created_at: string; status: string };
  return { createdAt: row.created_at, status: row.status };
}
