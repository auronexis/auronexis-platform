import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { TeamInvitationView, TeamMemberView } from "@/lib/team/types";
import type { SessionContext } from "@/lib/tenancy/context";
import type { AppUser, TeamInvitation } from "@/types/database";

/** All team members in the current organization. */
export async function listTeamMembers(session: SessionContext): Promise<TeamMemberView[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, role, is_disabled, created_at, organization_id, auth_user_id, updated_at")
    .eq("organization_id", session.organization.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TeamMemberView[];
}

/** Pending invitations for owner/admin team management. */
export async function listPendingInvitations(
  session: SessionContext,
): Promise<TeamInvitationView[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_invitations")
    .select(
      "id, organization_id, email, role, token, invited_by_user_id, accepted_at, expires_at, created_at",
    )
    .eq("organization_id", session.organization.id)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TeamInvitationView[];
}

export type InvitationDetails = TeamInvitation & {
  organization: { name: string };
};

/** Load invitation by token for public accept flow. */
export async function getInvitationByToken(token: string): Promise<InvitationDetails | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("team_invitations")
    .select(
      "id, organization_id, email, role, token, invited_by_user_id, accepted_at, expires_at, created_at, organizations ( name )",
    )
    .eq("token", token)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as TeamInvitation & { organizations: { name: string } | null };

  return {
    ...row,
    organization: { name: row.organizations?.name ?? "Organization" },
  };
}

/** Count active owners in organization — used to protect last owner. */
export async function countActiveOwners(organizationId: string): Promise<number> {
  const admin = createAdminClient();

  const { count, error } = await admin
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("role", "owner")
    .eq("is_disabled", false);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getTeamMemberById(
  session: SessionContext,
  userId: string,
): Promise<AppUser | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as AppUser | null) ?? null;
}
