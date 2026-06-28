import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/** Resolve the organization that receives inbound platform sales leads. */
export async function resolvePlatformSalesOrganizationId(): Promise<string | null> {
  const configured = process.env.PLATFORM_SALES_ORG_ID?.trim();
  if (configured) {
    return configured;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("organizations").select("id").order("created_at").limit(1).maybeSingle();

  if (error || !data) {
    console.error("[sales] Failed to resolve platform sales organization:", error?.message);
    return null;
  }

  return data.id;
}
