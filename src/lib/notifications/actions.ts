"use server";

import { revalidatePath } from "next/cache";
import { checkPlanFeatureSafe, resolveActionError } from "@/lib/action-errors";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type NotificationActionResult = {
  error?: string;
};

/** Mark a single notification as read. */
export async function markNotificationRead(
  notificationId: string,
): Promise<NotificationActionResult> {
  try {
    const session = await requireSession();
    const planError = await checkPlanFeatureSafe(session.organization.id, "notifications");
    if (planError) {
      return planError;
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() } as never)
      .eq("id", notificationId)
      .eq("organization_id", session.organization.id)
      .eq("user_id", session.user.id)
      .is("read_at", null);

    if (error) {
      console.error("[notifications] markNotificationRead failed:", error.message);
      return { error: "Unable to mark notification as read." };
    }

    revalidatePath("/notifications");
    revalidatePath("/", "layout");
    return {};
  } catch (error) {
    return resolveActionError(error, "Unable to mark notification as read.");
  }
}

/** Mark all notifications as read for the signed-in user. */
export async function markAllNotificationsRead(): Promise<NotificationActionResult> {
  try {
    const session = await requireSession();
    const planError = await checkPlanFeatureSafe(session.organization.id, "notifications");
    if (planError) {
      return planError;
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() } as never)
      .eq("organization_id", session.organization.id)
      .eq("user_id", session.user.id)
      .is("read_at", null);

    if (error) {
      console.error("[notifications] markAllNotificationsRead failed:", error.message);
      return { error: "Unable to mark notifications as read." };
    }

    revalidatePath("/notifications");
    revalidatePath("/", "layout");
    return {};
  } catch (error) {
    return resolveActionError(error, "Unable to mark notifications as read.");
  }
}
