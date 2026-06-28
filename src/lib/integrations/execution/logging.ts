import "server-only";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { sanitizeLogPayload } from "@/lib/integrations/secrets/masking";
import type {
  IntegrationDeliveryLogView,
  IntegrationDeliveryStatus,
  IntegrationProviderId,
} from "@/lib/integrations/types";
import type { IntegrationDeliveryLog } from "@/types/database";

export type CreateDeliveryLogInput = {
  organizationId: string;
  workflowId?: string;
  workflowExecutionId?: string;
  actionId?: string;
  providerId: IntegrationProviderId;
  status: IntegrationDeliveryStatus;
  retryCount?: number;
  maxRetries?: number;
  lastRetryAt?: string | null;
  nextRetryAt?: string | null;
  failureReason?: string | null;
  responseCode?: number | null;
  latencyMs?: number | null;
  deliveryId?: string | null;
  providerMessageId?: string | null;
  requestMethod?: string | null;
  requestUrl?: string | null;
  metadata?: Record<string, unknown>;
};

export type UpdateDeliveryLogInput = Partial<
  Omit<CreateDeliveryLogInput, "organizationId" | "providerId">
> & {
  logId: string;
  organizationId: string;
};

function rowToView(row: IntegrationDeliveryLog): IntegrationDeliveryLogView {
  return {
    id: row.id,
    providerId: row.provider_id,
    workflowId: row.workflow_id,
    workflowExecutionId: row.workflow_execution_id,
    actionId: row.action_id,
    status: row.status,
    retryCount: row.retry_count,
    responseCode: row.response_code,
    latencyMs: row.latency_ms,
    failureReason: row.failure_reason,
    providerMessageId: row.provider_message_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createDeliveryLog(input: CreateDeliveryLogInput): Promise<string> {
  const supabase = await createClient();
  const deliveryId = input.deliveryId ?? randomUUID();

  const { data, error } = await supabase
    .from("integration_delivery_logs")
    .insert({
      organization_id: input.organizationId,
      workflow_id: input.workflowId ?? null,
      workflow_execution_id: input.workflowExecutionId ?? null,
      action_id: input.actionId ?? null,
      provider_id: input.providerId,
      status: input.status,
      retry_count: input.retryCount ?? 0,
      max_retries: input.maxRetries ?? 4,
      last_retry_at: input.lastRetryAt ?? null,
      next_retry_at: input.nextRetryAt ?? null,
      failure_reason: input.failureReason ?? null,
      response_code: input.responseCode ?? null,
      latency_ms: input.latencyMs ?? null,
      delivery_id: deliveryId,
      provider_message_id: input.providerMessageId ?? null,
      request_method: input.requestMethod ?? null,
      request_url: input.requestUrl ?? null,
      metadata: sanitizeLogPayload(input.metadata ?? {}) as never,
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create integration delivery log: ${error?.message ?? "unknown"}`);
  }

  return (data as { id: string }).id;
}

export async function updateDeliveryLog(input: UpdateDeliveryLogInput): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("integration_delivery_logs")
    .update({
      ...(input.status != null ? { status: input.status } : {}),
      ...(input.retryCount != null ? { retry_count: input.retryCount } : {}),
      ...(input.maxRetries != null ? { max_retries: input.maxRetries } : {}),
      ...(input.lastRetryAt !== undefined ? { last_retry_at: input.lastRetryAt } : {}),
      ...(input.nextRetryAt !== undefined ? { next_retry_at: input.nextRetryAt } : {}),
      ...(input.failureReason !== undefined ? { failure_reason: input.failureReason } : {}),
      ...(input.responseCode !== undefined ? { response_code: input.responseCode } : {}),
      ...(input.latencyMs !== undefined ? { latency_ms: input.latencyMs } : {}),
      ...(input.deliveryId !== undefined ? { delivery_id: input.deliveryId } : {}),
      ...(input.providerMessageId !== undefined ? { provider_message_id: input.providerMessageId } : {}),
      ...(input.requestMethod !== undefined ? { request_method: input.requestMethod } : {}),
      ...(input.requestUrl !== undefined ? { request_url: input.requestUrl } : {}),
      ...(input.metadata != null ? { metadata: sanitizeLogPayload(input.metadata) as never } : {}),
    } as never)
    .eq("organization_id", input.organizationId)
    .eq("id", input.logId);

  if (error) {
    throw new Error(`Failed to update integration delivery log: ${error.message}`);
  }
}

export async function listDeliveryLogs(input: {
  organizationId: string;
  limit?: number;
}): Promise<IntegrationDeliveryLogView[]> {
  const supabase = await createClient();
  const limit = input.limit ?? 100;

  const { data, error } = await supabase
    .from("integration_delivery_logs")
    .select("*")
    .eq("organization_id", input.organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list integration delivery logs: ${error.message}`);
  }

  return ((data ?? []) as IntegrationDeliveryLog[]).map(rowToView);
}

export async function countDeliveryLogsByStatus(
  organizationId: string,
  status: IntegrationDeliveryStatus,
  since?: Date,
): Promise<number> {
  const supabase = await createClient();
  let query = supabase
    .from("integration_delivery_logs")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", status);

  if (since) {
    query = query.gte("created_at", since.toISOString());
  }

  const { count, error } = await query;
  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function getAverageLatencyToday(organizationId: string): Promise<number | null> {
  const supabase = await createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("integration_delivery_logs")
    .select("latency_ms")
    .eq("organization_id", organizationId)
    .eq("status", "delivered")
    .gte("created_at", startOfDay.toISOString())
    .not("latency_ms", "is", null);

  if (error || !data) {
    return null;
  }

  const rows = data as Array<{ latency_ms: number | null }>;
  if (rows.length === 0) {
    return null;
  }
  const total = rows.reduce((sum, row) => sum + (row.latency_ms ?? 0), 0);
  return Math.round(total / rows.length);
}
