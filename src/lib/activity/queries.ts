import { createClient } from "@/lib/supabase/server";
import type { ActivityEventView, ActivityFilter } from "@/lib/activity/types";
import { FILTER_TO_ENTITY_TYPE } from "@/lib/activity/types";
import type { SessionContext } from "@/lib/tenancy/context";

export const ACTIVITY_SELECT = `
  id, organization_id, actor_user_id, entity_type, entity_id, action, title, description, metadata, created_at,
  actor:users!activity_events_actor_user_id_fkey ( full_name )
`;

type ListActivityOptions = {
  filter?: ActivityFilter;
  limit?: number;
};

/** List activity events for the current organization. */
export async function listActivityEvents(
  session: SessionContext,
  options: ListActivityOptions = {},
): Promise<ActivityEventView[]> {
  const supabase = await createClient();
  const limit = options.limit ?? 50;

  let query = supabase
    .from("activity_events")
    .select(ACTIVITY_SELECT)
    .eq("organization_id", session.organization.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options.filter && options.filter !== "all") {
    query = query.eq("entity_type", FILTER_TO_ENTITY_TYPE[options.filter]);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ActivityEventView[];
}

/** Latest activity events for dashboard feed. */
export async function getRecentActivityEvents(
  session: SessionContext,
  limit = 10,
): Promise<ActivityEventView[]> {
  return listActivityEvents(session, { filter: "all", limit });
}
