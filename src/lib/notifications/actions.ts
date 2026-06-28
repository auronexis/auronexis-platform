"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { assertCanUseFeature } from "@/lib/plans/guards";
import { createClient } from "@/lib/supabase/server";

/** Mark a single notification as read. */
export async function markNotificationRead(notificationId: string): Promise<void> {
  const session = await requireSession();
  await assertCanUseFeature(session.organization.id, "notifications");
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() } as never)
    .eq("id", notificationId)
    .eq("organization_id", session.organization.id)
    .eq("user_id", session.user.id)
    .is("read_at", null);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

/** Mark all notifications as read for the signed-in user. */
export async function markAllNotificationsRead(): Promise<void> {
  const session = await requireSession();
  await assertCanUseFeature(session.organization.id, "notifications");
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() } as never)
    .eq("organization_id", session.organization.id)
    .eq("user_id", session.user.id)
    .is("read_at", null);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}
