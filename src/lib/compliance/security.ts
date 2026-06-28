import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export async function logDataAccess(input: {
  organizationId: string;
  userId: string;
  resourceType: string;
  resourceId?: string | null;
  action: string;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("data_access_logs").insert({
    organization_id: input.organizationId,
    user_id: input.userId,
    resource_type: input.resourceType,
    resource_id: input.resourceId ?? null,
    action: input.action,
    ip_address: input.ipAddress ?? null,
    metadata: input.metadata ?? {},
  } as never);

  if (error) {
    console.error("[compliance] data access log failed:", error.message);
  }
}

export async function complianceTablesReachable(): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_events").select("id").limit(1);
  return !error;
}
