import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { OrganizationEmailSettings } from "@/types/database";

const SETTINGS_SELECT = "id, organization_id, from_name, from_email, reply_to, created_at, updated_at";

/** Load email sender settings for the current organization. */
export async function getOrganizationEmailSettings(
  session: SessionContext,
): Promise<OrganizationEmailSettings | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_email_settings")
    .select(SETTINGS_SELECT)
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as OrganizationEmailSettings | null) ?? null;
}
