import "server-only";

import { recordActivityEvent } from "@/lib/activity/record";
import type { ActivityEventType } from "@/lib/activity/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type RiskActivityEventType =
  | "risk.created"
  | "risk.updated"
  | "risk.assigned"
  | "risk.score_changed"
  | "risk.status_changed"
  | "risk.accepted"
  | "risk.resolved"
  | "risk.dismissed"
  | "risk.deleted"
  | "risk.acknowledged"
  | "risk.mitigated"
  | "risk.detected";

export type RecordRiskActivityInput = {
  organizationId: string;
  riskId: string;
  actorUserId: string | null;
  eventType: RiskActivityEventType;
  message: string;
  metadata?: Record<string, unknown>;
};

/** Persist risk timeline entry and global activity feed event. */
export async function recordRiskActivity(input: RecordRiskActivityInput): Promise<void> {
  try {
    const admin = createAdminClient();
    const metadata = input.metadata ?? {};

    const { error: timelineError } = await admin.from("risk_activity").insert({
      organization_id: input.organizationId,
      risk_id: input.riskId,
      actor_user_id: input.actorUserId,
      event_type: input.eventType,
      message: input.message,
      metadata,
    } as never);

    if (timelineError) {
      console.warn("[risks] risk_activity insert failed:", timelineError.message);
    }

    await recordActivityEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      entityType: "risk",
      entityId: input.riskId,
      eventType: input.eventType as ActivityEventType,
      action: input.eventType.split(".")[1] ?? "updated",
      title: input.message,
      metadata: { riskId: input.riskId, ...metadata },
    });
  } catch (error) {
    console.warn("[risks] activity recording failed:", error);
  }
}
