import "server-only";

import { ensureDefaultRetentionRules } from "@/lib/compliance/retention";
import { createAdminClient } from "@/lib/supabase/admin";

/** Ensure default retention rules exist — simulation only, no auto-delete. */
export async function processRetentionCleanupJob(): Promise<Record<string, unknown>> {
  const admin = createAdminClient();
  const { data: orgs, error } = await admin.from("organizations").select("id").limit(50);

  if (error) {
    throw new Error(error.message);
  }

  let ensured = 0;

  for (const org of (orgs ?? []) as Array<{ id: string }>) {
    await ensureDefaultRetentionRules(org.id).catch(() => undefined);
    ensured += 1;
  }

  return { organizationsEnsured: ensured, autoDeleteEnabled: false };
}
