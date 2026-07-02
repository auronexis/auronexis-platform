import "server-only";

import type { ClientPortalSessionContext, PortalTimelineEvent } from "@/lib/client-portal/types";
import { PORTAL_TIMELINE_EVENT_TYPES } from "@/lib/client-portal/types";
import { createClient } from "@/lib/supabase/server";

/** Client-safe activity timeline — never throws. */
export async function getPortalTimeline(
  session: ClientPortalSessionContext,
  limit = 20,
): Promise<PortalTimelineEvent[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("activity_events")
      .select("id, event_type, title, description, created_at")
      .eq("organization_id", session.organization.id)
      .in("event_type", [...PORTAL_TIMELINE_EVENT_TYPES])
      .order("created_at", { ascending: false })
      .limit(limit * 2);

    if (error || !data) {
      return [];
    }

    return (data as PortalTimelineEvent[]).slice(0, limit);
  } catch {
    return [];
  }
}
