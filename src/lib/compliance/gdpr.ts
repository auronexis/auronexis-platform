import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { GdprRequestStatus, GdprRequestType } from "@/lib/compliance/types";
import { GDPR_REQUEST_LABELS } from "@/lib/compliance/types";

export async function countOpenGdprRequests(organizationId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("gdpr_requests")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("status", ["open", "processing"]);
  return count ?? 0;
}

export async function listGdprRequests(organizationId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("gdpr_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50);
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    requestType: row.request_type as GdprRequestType,
    requestLabel: GDPR_REQUEST_LABELS[row.request_type as GdprRequestType],
    subjectEmail: row.subject_email as string,
    status: row.status as GdprRequestStatus,
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    completedAt: (row.completed_at as string | null) ?? null,
  }));
}

export async function createGdprRequest(input: {
  organizationId: string;
  requestedBy: string;
  requestType: GdprRequestType;
  subjectEmail: string;
  notes?: string;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("gdpr_requests")
    .insert({
      organization_id: input.organizationId,
      request_type: input.requestType,
      subject_email: input.subjectEmail,
      status: "open",
      notes: input.notes ?? null,
      requested_by: input.requestedBy,
    } as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateGdprRequestStatus(input: {
  organizationId: string;
  requestId: string;
  status: GdprRequestStatus;
  notes?: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("gdpr_requests")
    .update({
      status: input.status,
      notes: input.notes ?? null,
      completed_at: ["completed", "rejected", "expired"].includes(input.status)
        ? new Date().toISOString()
        : null,
    } as never)
    .eq("organization_id", input.organizationId)
    .eq("id", input.requestId);

  if (error) {
    throw new Error(error.message);
  }
}
