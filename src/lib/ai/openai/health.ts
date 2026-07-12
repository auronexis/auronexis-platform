import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { OpenAIHealthRecord } from "@/lib/ai/openai/types";

export async function getLatestOpenAIHealthCheck(): Promise<OpenAIHealthRecord | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_openai_health_checks")
    .select("ok, model, latency_ms, provider_request_id, error_code, sanitized_message, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as {
    ok: boolean;
    model: string | null;
    latency_ms: number | null;
    provider_request_id: string | null;
    error_code: string | null;
    sanitized_message: string | null;
    created_at: string;
  };

  return {
    ok: row.ok,
    model: row.model,
    latencyMs: row.latency_ms,
    providerRequestId: row.provider_request_id,
    errorCode: row.error_code,
    sanitizedMessage: row.sanitized_message,
    createdAt: row.created_at,
  };
}

export async function getLatestSuccessfulOpenAIHealthCheck(): Promise<OpenAIHealthRecord | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_openai_health_checks")
    .select("ok, model, latency_ms, provider_request_id, error_code, sanitized_message, created_at")
    .eq("ok", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as {
    ok: boolean;
    model: string | null;
    latency_ms: number | null;
    provider_request_id: string | null;
    error_code: string | null;
    sanitized_message: string | null;
    created_at: string;
  };

  return {
    ok: row.ok,
    model: row.model,
    latencyMs: row.latency_ms,
    providerRequestId: row.provider_request_id,
    errorCode: row.error_code,
    sanitizedMessage: row.sanitized_message,
    createdAt: row.created_at,
  };
}

export async function getLatestFailedOpenAIHealthCheck(): Promise<OpenAIHealthRecord | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_openai_health_checks")
    .select("ok, model, latency_ms, provider_request_id, error_code, sanitized_message, created_at")
    .eq("ok", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as {
    ok: boolean;
    model: string | null;
    latency_ms: number | null;
    provider_request_id: string | null;
    error_code: string | null;
    sanitized_message: string | null;
    created_at: string;
  };

  return {
    ok: row.ok,
    model: row.model,
    latencyMs: row.latency_ms,
    providerRequestId: row.provider_request_id,
    errorCode: row.error_code,
    sanitizedMessage: row.sanitized_message,
    createdAt: row.created_at,
  };
}

export async function recordOpenAIHealthCheck(input: {
  ok: boolean;
  model: string | null;
  latencyMs: number | null;
  providerRequestId: string | null;
  errorCode: string | null;
  sanitizedMessage: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("platform_openai_health_checks").insert({
    ok: input.ok,
    model: input.model,
    latency_ms: input.latencyMs,
    provider_request_id: input.providerRequestId,
    error_code: input.errorCode,
    sanitized_message: input.sanitizedMessage,
  } as never);

  if (error) {
    console.error("[openai] failed to record health check:", error.message);
  }
}
