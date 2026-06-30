import { sessionHasPermission } from "@/lib/authorization/guards";
import { createClient } from "@/lib/supabase/server";
import type { ActivityEventView, ActivityFilter } from "@/lib/activity/types";
import { FILTER_TO_ENTITY_TYPE } from "@/lib/activity/types";
import type { SessionContext } from "@/lib/tenancy/context";

export const ACTIVITY_SELECT = `
  id, organization_id, actor_user_id, entity_type, entity_id, event_type, action, title, description, metadata, created_at,
  actor:users!activity_events_actor_user_id_fkey ( full_name )
`;

const ACTIVITY_SELECT_LEGACY = `
  id, organization_id, actor_user_id, entity_type, entity_id, action, title, description, metadata, created_at,
  actor:users!activity_events_actor_user_id_fkey ( full_name )
`;

type ListActivityOptions = {
  filter?: ActivityFilter;
  limit?: number;
};

function normalizeActivityEvent(row: Record<string, unknown>): ActivityEventView {
  const eventType =
    typeof row.event_type === "string" && row.event_type.length > 0
      ? row.event_type
      : typeof row.action === "string"
        ? row.action
        : "unknown";

  return {
    ...(row as ActivityEventView),
    event_type: eventType,
  };
}

/** List activity events for the current organization. Requires activity.read. */
export async function listActivityEvents(
  session: SessionContext,
  options: ListActivityOptions = {},
): Promise<ActivityEventView[]> {
  if (!sessionHasPermission(session, "activity.read")) {
    return [];
  }

  const supabase = await createClient();
  const limit = options.limit ?? 20;

  let query = supabase
    .from("activity_events")
    .select(ACTIVITY_SELECT)
    .eq("organization_id", session.organization.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options.filter && options.filter !== "all") {
    query = query.eq("entity_type", FILTER_TO_ENTITY_TYPE[options.filter]);
  }

  let { data, error } = await query;

  if (error && error.message.toLowerCase().includes("event_type")) {
    let legacyQuery = supabase
      .from("activity_events")
      .select(ACTIVITY_SELECT_LEGACY)
      .eq("organization_id", session.organization.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (options.filter && options.filter !== "all") {
      legacyQuery = legacyQuery.eq("entity_type", FILTER_TO_ENTITY_TYPE[options.filter]);
    }

    ({ data, error } = await legacyQuery);
  }

  if (error) {
    console.warn("[activity] failed to list events:", error.message);
    return [];
  }

  return (data ?? []).map((row) => normalizeActivityEvent(row as Record<string, unknown>));
}

/** Latest activity events for dashboard feed. */
export async function getRecentActivityEvents(
  session: SessionContext,
  limit = 5,
): Promise<ActivityEventView[]> {
  return listActivityEvents(session, { filter: "all", limit });
}
