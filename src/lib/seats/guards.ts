import { recordActivityEvent } from "@/lib/activity/record";
import { createNotificationForOwnersAndAdmins } from "@/lib/notifications/create";
import { canInviteSeat } from "@/lib/entitlements/checks";
import {
  getOrganizationSeatUsage,
} from "@/lib/seats/queries";
import type { SeatInviteCheckResult } from "@/lib/seats/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionContext } from "@/lib/tenancy/context";

const SEAT_LIMIT_ACTIVITY_COOLDOWN_MS = 60 * 60 * 1000;
const SEAT_LIMIT_NOTIFICATION_COOLDOWN_MS = 24 * 60 * 60 * 1000;

async function hasRecentSeatLimitActivity(organizationId: string): Promise<boolean> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - SEAT_LIMIT_ACTIVITY_COOLDOWN_MS).toISOString();

  const { count, error } = await admin
    .from("activity_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("action", "seat_limit_reached")
    .gte("created_at", since);

  if (error) {
    console.error("[seats] activity lookup failed:", error.message);
    return true;
  }

  return (count ?? 0) > 0;
}

async function hasRecentSeatLimitNotification(organizationId: string): Promise<boolean> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - SEAT_LIMIT_NOTIFICATION_COOLDOWN_MS).toISOString();

  const { count, error } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("type", "seat_limit_reached")
    .gte("created_at", since);

  if (error) {
    console.error("[seats] notification lookup failed:", error.message);
    return true;
  }

  return (count ?? 0) > 0;
}

async function recordSeatLimitReachedSideEffects(
  organizationId: string,
  actorUserId: string | null,
  limit: number,
  used: number,
): Promise<void> {
  const shouldRecordActivity = !(await hasRecentSeatLimitActivity(organizationId));

  if (shouldRecordActivity) {
    await recordActivityEvent({
      organizationId,
      actorUserId,
      entityType: "team",
      entityId: null,
      action: "seat_limit_reached",
      title: "Seat limit reached",
      description: `Team seat usage is ${used} of ${limit} included seats.`,
      metadata: { limit, used, automated: true },
    });
  }

  const shouldNotify = !(await hasRecentSeatLimitNotification(organizationId));

  if (shouldNotify) {
    await createNotificationForOwnersAndAdmins(organizationId, {
      type: "seat_limit_reached",
      title: "Seat limit reached",
      message: "Seat limit reached. Upgrade your plan to invite more team members.",
      entityType: "team",
      entityId: null,
    });
  }
}

/** Whether the organization can create another team invitation. */
export async function canInviteTeamMember(organizationId: string): Promise<boolean> {
  const check = await canInviteSeat({ organizationId });
  return check.allowed;
}

/** Assert invite is allowed — records activity/notification when blocked. */
export async function assertCanInviteTeamMember(
  organizationId: string,
  actorUserId: string | null,
): Promise<SeatInviteCheckResult> {
  const check = await canInviteSeat({ organizationId });

  if (check.allowed) {
    return { allowed: true };
  }

  const usage = await getOrganizationSeatUsage(organizationId);

  await recordSeatLimitReachedSideEffects(
    organizationId,
    actorUserId,
    usage.limit,
    usage.used,
  );

  return {
    allowed: false,
    message: check.message,
  };
}

/** Whether a pending invitation can be accepted without exceeding seat limits. */
export async function canAcceptTeamInvite(organizationId: string): Promise<SeatInviteCheckResult> {
  const usage = await getOrganizationSeatUsage(organizationId);

  if (usage.used > usage.limit) {
    return {
      allowed: false,
      message:
        "This organization has reached its seat limit. Please contact an administrator.",
    };
  }

  if (usage.activeUsers >= usage.limit && usage.pendingInvitations === 0) {
    return {
      allowed: false,
      message:
        "This organization has reached its seat limit. Please contact an administrator.",
    };
  }

  return { allowed: true };
}

/** Session-scoped invite check for UI. */
export async function getInviteSeatCheckForSession(
  session: SessionContext,
): Promise<SeatInviteCheckResult> {
  const check = await canInviteSeat(session);
  return check.allowed ? { allowed: true } : { allowed: false, message: check.message };
}
