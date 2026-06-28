import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { Notification } from "@/types/database";

const NOTIFICATION_SELECT =
  "id, organization_id, user_id, type, title, message, entity_type, entity_id, read_at, created_at";

export type ListNotificationsOptions = {
  limit?: number;
  unreadOnly?: boolean;
};

/** List notifications for the signed-in user. */
export async function listNotifications(
  session: SessionContext,
  options: ListNotificationsOptions = {},
): Promise<Notification[]> {
  const supabase = await createClient();
  const limit = options.limit ?? 50;

  let query = supabase
    .from("notifications")
    .select(NOTIFICATION_SELECT)
    .eq("organization_id", session.organization.id)
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options.unreadOnly) {
    query = query.is("read_at", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Notification[];
}

/** Count unread notifications for the signed-in user. */
export async function getUnreadNotificationCount(session: SessionContext): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organization.id)
    .eq("user_id", session.user.id)
    .is("read_at", null);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
