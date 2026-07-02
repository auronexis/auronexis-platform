import { getOrganizationPlanContext } from "@/lib/plans/queries";
import type { PlanKey } from "@/lib/billing/plans";
import type { OrganizationSeatUsage } from "@/lib/seats/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";

/** Resolve seat limit from effective plan context. */
export async function getOrganizationSeatLimit(organizationId: string): Promise<{
  limit: number;
  planKey: PlanKey | null;
}> {
  const context = await getOrganizationPlanContext(organizationId);

  return {
    limit: context.features.seats,
    planKey: context.planKey,
  };
}

/** Count active agency users and pending non-expired invitations. */
export async function getOrganizationSeatUsage(
  organizationId: string,
): Promise<OrganizationSeatUsage> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const [{ limit, planKey }, activeUsersResult, pendingInvitationsResult] = await Promise.all([
    getOrganizationSeatLimit(organizationId),
    admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_disabled", false),
    admin
      .from("team_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("accepted_at", null)
      .gt("expires_at", now),
  ]);

  if (activeUsersResult.error) {
    throw new Error(activeUsersResult.error.message);
  }

  if (pendingInvitationsResult.error) {
    throw new Error(pendingInvitationsResult.error.message);
  }

  const activeUsers = activeUsersResult.count ?? 0;
  const pendingInvitations = pendingInvitationsResult.count ?? 0;
  const used = activeUsers + pendingInvitations;

  return {
    organizationId,
    limit,
    used,
    activeUsers,
    pendingInvitations,
    isOverLimit: used > limit,
    isAtLimit: used >= limit,
    planKey,
  };
}

/** Seat usage for the signed-in organization. */
export async function getOrganizationSeatUsageForSession(
  session: SessionContext,
): Promise<OrganizationSeatUsage> {
  return getOrganizationSeatUsage(session.organization.id);
}

/** Seat usage via RLS-scoped client — same counts, org isolated by session. */
export async function getOrganizationSeatUsageFromSession(
  session: SessionContext,
): Promise<OrganizationSeatUsage> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { limit, planKey } = await getOrganizationSeatLimit(session.organization.id);

  const [activeUsersResult, pendingInvitationsResult] = await Promise.all([
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", session.organization.id)
      .eq("is_disabled", false),
    supabase
      .from("team_invitations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", session.organization.id)
      .is("accepted_at", null)
      .gt("expires_at", now),
  ]);

  if (activeUsersResult.error) {
    throw new Error(activeUsersResult.error.message);
  }

  if (pendingInvitationsResult.error) {
    throw new Error(pendingInvitationsResult.error.message);
  }

  const activeUsers = activeUsersResult.count ?? 0;
  const pendingInvitations = pendingInvitationsResult.count ?? 0;
  const used = activeUsers + pendingInvitations;

  return {
    organizationId: session.organization.id,
    limit,
    used,
    activeUsers,
    pendingInvitations,
    isOverLimit: used > limit,
    isAtLimit: used >= limit,
    planKey,
  };
}
