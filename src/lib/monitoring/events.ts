import "server-only";

import { recordMonitoringActivity } from "@/lib/monitoring/activity";
import { dispatchWebhookEvent } from "@/lib/webhooks/events";
import { recordMonitoringEventSideEffects } from "@/lib/monitoring/integrations";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  MonitoringEventSeverity,
  MonitoringEventStatus,
} from "@/lib/monitoring/types";

export type RecordMonitoringEventInput = {
  organizationId: string;
  connectorId: string;
  clientId?: string | null;
  severity: MonitoringEventSeverity;
  status?: MonitoringEventStatus;
  message: string;
  payload?: Record<string, unknown>;
  actorUserId?: string | null;
};

/** Record a monitoring event with deduplication and downstream effects — never throws. */
export async function recordMonitoringEvent(input: RecordMonitoringEventInput): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data: recentDuplicate } = await admin
      .from("monitoring_events")
      .select("id")
      .eq("organization_id", input.organizationId)
      .eq("connector_id", input.connectorId)
      .eq("severity", input.severity)
      .eq("message", input.message)
      .gte("created_at", since)
      .maybeSingle();

    if (recentDuplicate) {
      return String((recentDuplicate as { id: string }).id);
    }

    const { data, error } = await admin
      .from("monitoring_events")
      .insert({
        organization_id: input.organizationId,
        connector_id: input.connectorId,
        client_id: input.clientId ?? null,
        severity: input.severity,
        status: input.status ?? "open",
        message: input.message,
        payload: input.payload ?? null,
      } as never)
      .select("id")
      .single();

    if (error || !data) {
      console.warn("[monitoring] recordMonitoringEvent failed:", error?.message);
      return null;
    }

    const eventId = String((data as { id: string }).id);

    await recordMonitoringActivity({
      organizationId: input.organizationId,
      connectorId: input.connectorId,
      eventType: "monitoring.event_detected",
      message: input.message,
      metadata: {
        eventId,
        severity: input.severity,
        clientId: input.clientId ?? null,
      },
      actorUserId: input.actorUserId ?? null,
    });

    void dispatchWebhookEvent({
      organizationId: input.organizationId,
      eventType: "monitoring.event_detected",
      payload: {
        eventId,
        connectorId: input.connectorId,
        clientId: input.clientId ?? null,
        severity: input.severity,
        message: input.message,
      },
    }).catch(() => undefined);

    await recordMonitoringEventSideEffects({
      organizationId: input.organizationId,
      connectorId: input.connectorId,
      clientId: input.clientId ?? null,
      severity: input.severity,
      message: input.message,
      actorUserId: input.actorUserId ?? null,
    });

    return eventId;
  } catch (error) {
    console.warn("[monitoring] recordMonitoringEvent failed:", error);
    return null;
  }
}
