import "server-only";

import { recordActivityEvent } from "@/lib/activity/record";
import type { ActivityEventType } from "@/lib/activity/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type MonitoringActivityEventType =
  | "monitoring.connector_created"
  | "monitoring.connector_updated"
  | "monitoring.connector_failed"
  | "monitoring.connector_recovered"
  | "monitoring.event_detected"
  | "monitoring.health_checked";

export type RecordMonitoringActivityInput = {
  organizationId: string;
  connectorId?: string | null;
  eventType: MonitoringActivityEventType;
  message: string;
  metadata?: Record<string, unknown>;
  actorUserId?: string | null;
};

/** Persist monitoring timeline entry and global activity feed event — never throws. */
export async function recordMonitoringActivity(input: RecordMonitoringActivityInput): Promise<void> {
  try {
    const admin = createAdminClient();
    const metadata = input.metadata ?? {};

    const { error: timelineError } = await admin.from("monitoring_activity").insert({
      organization_id: input.organizationId,
      connector_id: input.connectorId ?? null,
      event_type: input.eventType,
      message: input.message,
      metadata,
    } as never);

    if (timelineError) {
      console.warn("[monitoring] monitoring_activity insert failed:", timelineError.message);
    }

    await recordActivityEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId ?? null,
      entityType: "organization",
      entityId: input.connectorId ?? input.organizationId,
      eventType: input.eventType as ActivityEventType,
      action: input.eventType.split(".")[1] ?? "updated",
      title: input.message,
      metadata: { connectorId: input.connectorId, ...metadata },
    });
  } catch (error) {
    console.warn("[monitoring] activity recording failed:", error);
  }
}
