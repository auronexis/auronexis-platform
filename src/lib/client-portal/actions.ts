"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import { createNotificationForOwnersAndAdmins } from "@/lib/notifications/create";
import { requireSession } from "@/lib/auth/session";
import { ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import { canManagePortalUsers } from "@/lib/client-portal/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ClientPortalUserInsert = Database["public"]["Tables"]["client_portal_users"]["Insert"];
type ClientPortalUserUpdate = Database["public"]["Tables"]["client_portal_users"]["Update"];

export type PortalAuthActionState = {
  error?: string;
};

export type PortalUserActionState = {
  error?: string;
  success?: string;
};

const portalLoginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const createPortalUserSchema = z.object({
  clientId: z.string().uuid(),
  email: z.string().email("Enter a valid email address."),
  fullName: z.string().trim().min(2, "Full name is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

/** Sign in to the client portal. */
export async function signInPortal(
  _prevState: PortalAuthActionState,
  formData: FormData,
): Promise<PortalAuthActionState> {
  const parsed = portalLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid credentials." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { error: "Invalid email or password." };
  }

  const { data: portalUser, error: portalError } = await supabase
    .from("client_portal_users")
    .select("id, client_id, organization_id, email, full_name")
    .eq("auth_user_id", data.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (portalError || !portalUser) {
    await supabase.auth.signOut();
    return { error: "This account does not have client portal access." };
  }

  await supabase
    .from("client_portal_users")
    .update({ last_login_at: new Date().toISOString() } as never)
    .eq("id", (portalUser as { id: string }).id);

  const { recordPortalActivity } = await import("@/lib/client-portal/activity");
  const { getClientPortalSession } = await import("@/lib/client-portal/session");
  const portalSession = await getClientPortalSession();

  if (portalSession) {
    void recordPortalActivity(portalSession, {
      eventType: "portal.login",
      title: "Portal login",
      description: portalSession.portalUser.email,
    }).catch(() => undefined);
  }

  revalidatePath("/", "layout");
  redirect("/client-portal/overview");
}

/** Sign out from the client portal. */
export async function signOutPortal(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/client-portal/login");
}

/** Create a client portal user — Owner/Admin only. */
export async function createPortalUserAction(
  _prevState: PortalUserActionState,
  formData: FormData,
): Promise<PortalUserActionState> {
  const session = await requireSession();

  if (!canManagePortalUsers(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const parsed = createPortalUserSchema.safeParse({
    clientId: formData.get("clientId"),
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid portal user data." };
  }

  const admin = createAdminClient();

  const { data: clientData, error: clientError } = await admin
    .from("clients")
    .select("id, name")
    .eq("id", parsed.data.clientId)
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  const client = clientData as { id: string; name: string } | null;

  if (clientError || !client) {
    return { error: "Client not found." };
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName, portal: true },
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Unable to create portal login." };
  }

  const insertPayload: ClientPortalUserInsert = {
    auth_user_id: authData.user.id,
    organization_id: session.organization.id,
    client_id: client.id,
    email: parsed.data.email.toLowerCase(),
    full_name: parsed.data.fullName,
    is_active: true,
  };

  const { data: portalUserData, error: insertError } = await admin
    .from("client_portal_users")
    .insert(insertPayload as never)
    .select("id")
    .single();

  const portalUser = portalUserData as { id: string } | null;

  if (insertError || !portalUser) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: "Unable to create portal user record." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "client",
    entityId: client.id,
    action: "portal_user_created",
    title: `Portal user created: ${parsed.data.fullName}`,
    description: `${parsed.data.email} for ${client.name}`,
    metadata: {
      clientId: client.id,
      portalUserId: portalUser.id,
      email: parsed.data.email.toLowerCase(),
    },
  });

  await createNotificationForOwnersAndAdmins(session.organization.id, {
    type: "portal_user_created",
    title: "Client portal user created",
    message: `${parsed.data.fullName} (${parsed.data.email}) was added for ${client.name}.`,
    entityType: "client",
    entityId: client.id,
  });

  revalidatePath(`/clients/${client.id}`);
  revalidatePath("/activity");
  revalidatePath("/notifications");
  revalidatePath("/", "layout");

  return { success: `Portal access created for ${parsed.data.email}.` };
}

/** Disable a client portal user — Owner/Admin only. */
export async function disablePortalUserAction(
  portalUserId: string,
): Promise<void> {
  const session = await requireSession();

  if (!canManagePortalUsers(session)) {
    throw new Error(ACTION_DENIED_MESSAGE);
  }

  const supabase = await createClient();

  const { data: portalUserData, error: fetchError } = await supabase
    .from("client_portal_users")
    .select("id, client_id, email, full_name, is_active, auth_user_id")
    .eq("id", portalUserId)
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  const portalUser = portalUserData as {
    id: string;
    client_id: string;
    email: string;
    full_name: string;
    is_active: boolean;
    auth_user_id: string;
  } | null;

  if (fetchError || !portalUser) {
    return;
  }

  if (!portalUser.is_active) {
    return;
  }

  const updatePayload: ClientPortalUserUpdate = { is_active: false };

  const { error: updateError } = await supabase
    .from("client_portal_users")
    .update(updatePayload as never)
    .eq("id", portalUser.id)
    .eq("organization_id", session.organization.id);

  if (updateError) {
    return;
  }

  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(portalUser.auth_user_id, { ban_duration: "876000h" });

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "client",
    entityId: portalUser.client_id,
    action: "portal_user_disabled",
    title: `Portal user disabled: ${portalUser.full_name}`,
    description: portalUser.email,
    metadata: {
      clientId: portalUser.client_id,
      portalUserId: portalUser.id,
      email: portalUser.email,
    },
  });

  revalidatePath(`/clients/${portalUser.client_id}`);
  revalidatePath("/activity");
}

export type PortalFeedbackState = {
  error?: string;
  success?: boolean;
};

/** Submit onboarding feedback from the client portal. */
export async function submitPortalOnboardingFeedback(
  _prev: PortalFeedbackState,
  formData: FormData,
): Promise<PortalFeedbackState> {
  const { requireClientPortalSession } = await import("@/lib/client-portal/session");
  const session = await requireClientPortalSession();

  const feedback = formData.get("feedback")?.toString()?.trim();
  const satisfaction = Number(formData.get("satisfactionScore") ?? 0);

  if (!feedback || feedback.length < 4) {
    return { error: "Please enter feedback (at least 4 characters)." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("portal_customer_onboarding")
    .select("id, milestones_completed, milestones_total, open_tasks")
    .eq("organization_id", session.organization.id)
    .eq("client_id", session.client.id)
    .maybeSingle();

  const milestonesCompleted = Math.min(
    (existing as { milestones_completed?: number } | null)?.milestones_completed ?? 5,
    (existing as { milestones_total?: number } | null)?.milestones_total ?? 6,
  );

  if (existing) {
    const { error } = await supabase
      .from("portal_customer_onboarding")
      .update({
        feedback,
        satisfaction_score: Math.min(100, Math.max(0, satisfaction)),
        onboarding_status: "feedback_received",
        milestones_completed: Math.max(milestonesCompleted, 5),
        open_tasks: Math.max(0, ((existing as { open_tasks?: number }).open_tasks ?? 1) - 1),
      } as never)
      .eq("id", (existing as { id: string }).id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("portal_customer_onboarding").insert({
      organization_id: session.organization.id,
      client_id: session.client.id,
      feedback,
      satisfaction_score: Math.min(100, Math.max(0, satisfaction)),
      onboarding_status: "feedback_received",
      milestones_completed: 5,
      milestones_total: 6,
      open_tasks: 0,
    } as never);

    if (error) return { error: error.message };
  }

  revalidatePath("/client-portal/onboarding");
  return { success: true };
}
