import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export async function resolvePrimaryBillingRecipientForEmail(
  organizationId: string,
): Promise<{ userId: string; email: string } | null> {
  const admin = createAdminClient();

  const { data: owners, error: ownerError } = await admin
    .from("users")
    .select("id, email")
    .eq("organization_id", organizationId)
    .eq("role", "owner")
    .eq("is_disabled", false)
    .order("created_at", { ascending: true })
    .limit(1);

  if (ownerError) {
    console.error("[email][billing-recipient] owner lookup failed", { code: ownerError.code });
    return null;
  }

  const owner = owners?.[0] as { id: string; email: string } | undefined;
  if (owner?.id && owner.email) {
    return { userId: owner.id, email: owner.email };
  }

  const { data: admins, error: adminError } = await admin
    .from("users")
    .select("id, email")
    .eq("organization_id", organizationId)
    .eq("role", "admin")
    .eq("is_disabled", false)
    .order("created_at", { ascending: true })
    .limit(1);

  if (adminError) {
    console.error("[email][billing-recipient] admin lookup failed", { code: adminError.code });
    return null;
  }

  const adminUser = admins?.[0] as { id: string; email: string } | undefined;
  if (!adminUser?.id || !adminUser.email) {
    return null;
  }

  return { userId: adminUser.id, email: adminUser.email };
}
