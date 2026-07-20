"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import { requireSession } from "@/lib/auth/session";
import { ACTION_DENIED_MESSAGE, assertPermissionSafe, sessionHasPermission } from "@/lib/authorization/guards";
import { getAppUrl } from "@/lib/env";
import {
  canAssignRole,
  canInviteTeamMembers,
  canManageOrganizationSettings,
  canManageTeamMember,
  getInvitableRoles,
  getAssignableRoles,
} from "@/lib/team/guards";
import {
  countActiveOwners,
  getInvitationByToken,
  getTeamMemberById,
} from "@/lib/team/queries";
import { buildInviteUrl } from "@/lib/team/types";
import { assertCanInviteTeamMember, canAcceptTeamInvite } from "@/lib/seats/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database, InviteRole } from "@/types/database";

type TeamInvitationInsert = Database["public"]["Tables"]["team_invitations"]["Insert"];

export type TeamActionState = {
  error?: string;
  success?: string;
  inviteUrl?: string;
};

export type AcceptInviteActionState = {
  error?: string;
};

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  role: z.enum(["admin", "staff", "viewer"] as const),
});

const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["owner", "admin", "staff", "viewer"] as const),
});

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  fullName: z.string().trim().min(2, "Full name is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const organizationSchema = z.object({
  name: z.string().trim().min(2, "Organization name is required."),
  language: z.enum(["de", "en"] as const),
  currency: z.enum([
    "USD",
    "EUR",
    "GBP",
    "CAD",
    "AUD",
    "CHF",
    "JPY",
    "NOK",
    "SEK",
    "DKK",
    "PLN",
    "CZK",
    "RON",
  ] as const),
  timezone: z.string().trim().min(1),
  dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] as const),
  timeFormat: z.enum(["12h", "24h"] as const),
  weekStart: z.enum(["monday", "sunday"] as const),
  measurementSystem: z.enum(["metric", "imperial"] as const),
});

function assertInvitableRole(
  session: Awaited<ReturnType<typeof requireSession>>,
  role: InviteRole,
): { error: string } | null {
  if (!getInvitableRoles(session).includes(role)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  return null;
}

/** Invite a team member — Owner/Admin only. */
export async function inviteTeamMemberAction(
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const session = await requireSession();

  if (!canInviteTeamMembers(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid invitation data." };
  }

  const roleDenied = assertInvitableRole(session, parsed.data.role);
  if (roleDenied) {
    return roleDenied;
  }

  const seatCheck = await assertCanInviteTeamMember(
    session.organization.id,
    session.user.id,
  );

  if (!seatCheck.allowed) {
    return { error: seatCheck.message };
  }

  const admin = createAdminClient();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const payload: TeamInvitationInsert = {
    organization_id: session.organization.id,
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    token,
    invited_by_user_id: session.user.id,
    expires_at: expiresAt,
  };

  const { error } = await admin.from("team_invitations").insert(payload as never);

  if (error) {
    return { error: "Unable to create invitation." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "team",
    entityId: null,
    eventType: "team.invited",
    action: "invitation_created",
    title: `Invitation sent to ${parsed.data.email}`,
    description: `Invited as ${parsed.data.role}.`,
    metadata: { email: parsed.data.email, role: parsed.data.role },
  });

  revalidatePath("/settings/team");
  revalidatePath("/activity");

  return {
    success: "Invitation created.",
    inviteUrl: buildInviteUrl(token, getAppUrl()),
  };
}

/** Change a team member role — Owner/Admin with restrictions. */
export async function updateTeamMemberRoleAction(
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const session = await requireSession();
  const denied = assertPermissionSafe(session.role, "users.write");
  if (denied) {
    return denied;
  }

  const parsed = roleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid role data." };
  }

  const target = await getTeamMemberById(session, parsed.data.userId);

  if (!target) {
    return { error: "Team member not found." };
  }

  if (!canManageTeamMember(session, target)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  if (!canAssignRole(session, parsed.data.role)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  if (target.role === "owner" && parsed.data.role !== "owner") {
    const ownerCount = await countActiveOwners(session.organization.id);
    if (ownerCount <= 1) {
      return { error: "Cannot change role of the last active owner." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ role: parsed.data.role } as never)
    .eq("id", target.id)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: "Unable to update team member role." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "team",
    entityId: target.id,
    eventType: "team.role_updated",
    action: "role_changed",
    title: `${target.full_name} role updated`,
    description: `Changed from ${target.role} to ${parsed.data.role}.`,
    metadata: { userId: target.id, fromRole: target.role, toRole: parsed.data.role },
  });

  revalidatePath("/settings/team");
  revalidatePath("/activity");
  return { success: "Role updated." };
}

/** Disable or reactivate a team member. */
export async function setTeamMemberStatusAction(
  userId: string,
  isDisabled: boolean,
): Promise<TeamActionState> {
  const session = await requireSession();

  if (!sessionHasPermission(session, "users.write")) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const target = await getTeamMemberById(session, userId);

  if (!target) {
    return { error: "Team member not found." };
  }

  if (!canManageTeamMember(session, target)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  if (target.role === "owner" && isDisabled) {
    const ownerCount = await countActiveOwners(session.organization.id);
    if (ownerCount <= 1) {
      return { error: "Cannot disable the last active owner." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ is_disabled: isDisabled } as never)
    .eq("id", target.id)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: "Unable to update team member status." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "team",
    entityId: target.id,
    eventType: isDisabled ? "team.user_disabled" : "team.user_reactivated",
    action: isDisabled ? "user_disabled" : "user_reactivated",
    title: `${target.full_name} ${isDisabled ? "disabled" : "reactivated"}`,
    metadata: { userId: target.id, isDisabled },
  });

  revalidatePath("/settings/team");
  revalidatePath("/activity");
  return { success: isDisabled ? "User disabled." : "User reactivated." };
}

/** Accept a team invitation and create account. */
export async function acceptInvitationAction(
  _prevState: AcceptInviteActionState,
  formData: FormData,
): Promise<AcceptInviteActionState> {
  const parsed = acceptInviteSchema.safeParse({
    token: formData.get("token"),
    fullName: formData.get("fullName"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid registration data." };
  }

  const invitation = await getInvitationByToken(parsed.data.token);

  if (!invitation) {
    return { error: "Invitation not found." };
  }

  if (invitation.accepted_at) {
    return { error: "This invitation has already been accepted." };
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return { error: "This invitation has expired." };
  }

  const seatCheck = await canAcceptTeamInvite(invitation.organization_id);

  if (!seatCheck.allowed) {
    return { error: seatCheck.message };
  }

  const admin = createAdminClient();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: invitation.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName },
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Unable to create account." };
  }

  const { error: profileError } = await admin.from("users").insert({
    auth_user_id: authData.user.id,
    organization_id: invitation.organization_id,
    full_name: parsed.data.fullName,
    email: invitation.email,
    role: invitation.role,
    is_disabled: false,
  } as never);

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: "Unable to create user profile." };
  }

  const { error: inviteError } = await admin
    .from("team_invitations")
    .update({ accepted_at: new Date().toISOString() } as never)
    .eq("id", invitation.id);

  if (inviteError) {
    return { error: "Account created but invitation could not be marked accepted." };
  }

  await recordActivityEvent({
    organizationId: invitation.organization_id,
    actorUserId: null,
    entityType: "team",
    entityId: invitation.id,
    action: "invitation_accepted",
    title: `${parsed.data.fullName} joined the team`,
    description: `Accepted invitation as ${invitation.role}.`,
    metadata: { email: invitation.email, role: invitation.role },
  });

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invitation.email,
    password: parsed.data.password,
  });

  if (signInError) {
    redirect("/login");
  }

  revalidatePath("/", "layout");
  revalidatePath("/activity");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/** Update organization name — Owner/Admin only. */
export async function updateOrganizationAction(
  _prevState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const parsed = organizationSchema.safeParse({
    name: formData.get("name"),
    language: formData.get("language"),
    currency: formData.get("currency"),
    timezone: formData.get("timezone"),
    dateFormat: formData.get("dateFormat"),
    timeFormat: formData.get("timeFormat"),
    weekStart: formData.get("weekStart"),
    measurementSystem: formData.get("measurementSystem"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid organization name." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organizations")
    .update({
      name: parsed.data.name,
      language: parsed.data.language,
      currency: parsed.data.currency,
      timezone: parsed.data.timezone,
      date_format: parsed.data.dateFormat,
      time_format: parsed.data.timeFormat,
      week_start: parsed.data.weekStart,
      measurement_system: parsed.data.measurementSystem,
    } as never)
    .eq("id", session.organization.id)
    .select(
      "id, name, language, currency, timezone, date_format, time_format, week_start, measurement_system",
    )
    .single();

  if (error) {
    if (
      error.message.includes("language") ||
      error.message.includes("currency") ||
      error.message.includes("timezone") ||
      error.message.includes("date_format") ||
      error.code === "42703" ||
      error.code === "PGRST204"
    ) {
      return {
        error:
          "Organization settings could not be saved. Apply the latest database migration and try again.",
      };
    }
    return { error: "Unable to update organization." };
  }

  const saved = data as {
    language?: string;
    currency?: string;
    timezone?: string;
    date_format?: string;
    time_format?: string;
    week_start?: string;
    measurement_system?: string;
  } | null;
  if (saved?.language !== parsed.data.language) {
    return { error: "Organization language did not persist. Please try again." };
  }
  if (saved?.currency !== parsed.data.currency) {
    return { error: "Organization currency did not persist. Please try again." };
  }
  if (saved?.timezone !== parsed.data.timezone) {
    return { error: "Organization timezone did not persist. Please try again." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "organization",
    entityId: session.organization.id,
    eventType: "settings.updated",
    action: "organization_updated",
    title: "Organization settings updated",
    description: parsed.data.name,
    metadata: {
      name: parsed.data.name,
      language: parsed.data.language,
      currency: parsed.data.currency,
      timezone: parsed.data.timezone,
      dateFormat: parsed.data.dateFormat,
      timeFormat: parsed.data.timeFormat,
      weekStart: parsed.data.weekStart,
      measurementSystem: parsed.data.measurementSystem,
    },
  });

  revalidatePath("/settings/organization");
  revalidatePath("/settings/billing");
  revalidatePath("/activity");
  revalidatePath("/", "layout");
  return { success: "Organization updated." };
}

export { getAssignableRoles, getInvitableRoles };
