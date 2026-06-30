"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import { fireWorkflowEngine } from "@/lib/automation/engine-v2/dispatch-hook";
import { requireSession } from "@/lib/auth/session";
import { assertPermissionSafe } from "@/lib/authorization/guards";
import { assertCanCreateClient } from "@/lib/plans/guards";
import { canViewRevenue } from "@/lib/rbac/permissions";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];

export type ClientActionState = {
  error?: string;
};

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .optional();

const clientFieldsSchema = z.object({
  name: z.string().trim().min(2, "Client name is required."),
  status: z.enum(["active", "watch", "critical", "archived"] as const),
  ownerId: optionalText,
  healthScore: z
    .string()
    .optional()
    .transform((value) => {
      if (!value || value.trim().length === 0) {
        return null;
      }

      const parsed = Number(value);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
        return Number.NaN;
      }

      return Math.round(parsed);
    })
    .refine((value) => value === null || !Number.isNaN(value), {
      message: "Health score must be between 0 and 100.",
    }),
  contactName: optionalText,
  contactEmail: z
    .string()
    .trim()
    .optional()
    .transform((value) => (!value ? null : value))
    .refine(
      (value) => value === null || z.string().email().safeParse(value).success,
      { message: "Enter a valid contact email." },
    ),
  notes: optionalText,
  monthlyRevenue: z
    .string()
    .optional()
    .transform((value) => {
      if (!value || value.trim().length === 0) {
        return null;
      }

      const parsed = Number(value);
      if (Number.isNaN(parsed) || parsed < 0) {
        return Number.NaN;
      }

      return parsed;
    })
    .refine((value) => value === null || !Number.isNaN(value), {
      message: "Enter a valid monthly revenue amount.",
    }),
});

function parseClientForm(formData: FormData) {
  return clientFieldsSchema.safeParse({
    name: formData.get("name"),
    status: formData.get("status") ?? "active",
    ownerId: formData.get("ownerId"),
    healthScore: formData.get("healthScore"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    notes: formData.get("notes"),
    monthlyRevenue: formData.get("monthlyRevenue"),
  });
}

async function verifyOwnerInOrg(organizationId: string, ownerId: string | null): Promise<boolean> {
  if (!ownerId) {
    return true;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("id", ownerId)
    .eq("organization_id", organizationId)
    .eq("is_disabled", false)
    .maybeSingle();

  return Boolean(data);
}

function buildClientPayload(
  parsed: z.infer<typeof clientFieldsSchema>,
  includeRevenue: boolean,
  defaultOwnerId?: string,
) {
  return {
    name: parsed.name,
    status: parsed.status,
    owner_id: parsed.ownerId ?? defaultOwnerId ?? null,
    health_score: parsed.healthScore,
    contact_name: parsed.contactName ?? null,
    contact_email: parsed.contactEmail ?? null,
    notes: parsed.notes ?? null,
    ...(includeRevenue ? { monthly_revenue: parsed.monthlyRevenue } : {}),
  };
}

/** Create a client — Owner/Admin only. */
export async function createClientAction(
  _prevState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const session = await requireSession();
  const denied = assertPermissionSafe(session.role, "clients.write");
  if (denied) {
    return denied;
  }

  const clientLimitCheck = await assertCanCreateClient(
    session.organization.id,
    session.user.id,
  );

  if (!clientLimitCheck.allowed) {
    return { error: clientLimitCheck.message };
  }

  const parsed = parseClientForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid client data." };
  }

  const ownerId = parsed.data.ownerId ?? session.user.id;
  if (!(await verifyOwnerInOrg(session.organization.id, ownerId))) {
    return { error: "Selected owner is not valid." };
  }

  const supabase = await createClient();
  const insertPayload: ClientInsert = {
    organization_id: session.organization.id,
    ...buildClientPayload(parsed.data, canViewRevenue(session.role), ownerId),
  };

  const { data, error } = await supabase
    .from("clients")
    .insert(insertPayload as never)
    .select("id")
    .single();

  const created = data as { id: string } | null;

  if (error || !created) {
    return { error: "Unable to create client." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "client",
    entityId: created.id,
    eventType: "client.created",
    action: "created",
    title: `Client created: ${parsed.data.name}`,
    metadata: { clientId: created.id, name: parsed.data.name },
  });

  await fireWorkflowEngine({
    trigger: "client_created",
    organizationId: session.organization.id,
    entityType: "client",
    entityId: created.id,
    clientId: created.id,
    actorUserId: session.user.id,
    payload: {
      title: parsed.data.name,
      status: parsed.data.status,
      clientStatus: parsed.data.status,
    },
  });

  revalidatePath("/clients");
  revalidatePath("/activity");
  redirect(`/clients/${created.id}`);
}

/** Update a client — Owner/Admin only. */
export async function updateClientAction(
  clientId: string,
  _prevState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const session = await requireSession();
  const denied = assertPermissionSafe(session.role, "clients.write");
  if (denied) {
    return denied;
  }

  const parsed = parseClientForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid client data." };
  }

  if (!(await verifyOwnerInOrg(session.organization.id, parsed.data.ownerId ?? null))) {
    return { error: "Selected owner is not valid." };
  }

  const supabase = await createClient();
  const { data: existingClient } = await supabase
    .from("clients")
    .select("status")
    .eq("id", clientId)
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  const updatePayload: ClientUpdate = buildClientPayload(
    parsed.data,
    canViewRevenue(session.role),
  );

  const { error } = await supabase
    .from("clients")
    .update(updatePayload as never)
    .eq("id", clientId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: "Unable to update client." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "client",
    entityId: clientId,
    eventType: "client.updated",
    action: "updated",
    title: `Client updated: ${parsed.data.name}`,
    metadata: { clientId, name: parsed.data.name },
  });

  const previousStatus = (existingClient as { status?: string } | null)?.status;
  if (previousStatus && previousStatus !== parsed.data.status) {
    await fireWorkflowEngine({
      trigger: "customer_health_changed",
      organizationId: session.organization.id,
      entityType: "client",
      entityId: clientId,
      clientId,
      actorUserId: session.user.id,
      payload: {
        title: parsed.data.name,
        status: parsed.data.status,
        clientStatus: parsed.data.status,
        customerHealth: parsed.data.status,
        previousStatus,
      },
    });
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/activity");
  return {};
}

type ArchiveClientOptions = {
  redirectTo?: string | false;
};

/** Archive a client (status → archived) — Owner/Admin only. */
export async function archiveClientAction(
  clientId: string,
  options: ArchiveClientOptions = {},
): Promise<void> {
  const session = await requireSession();
  const denied = assertPermissionSafe(session.role, "clients.write");
  if (denied) {
    throw new Error(denied.error);
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  const clientName = (existing as { name: string } | null)?.name ?? "Client";
  const archivePayload: ClientUpdate = { status: "archived" };

  const { error } = await supabase
    .from("clients")
    .update(archivePayload as never)
    .eq("id", clientId)
    .eq("organization_id", session.organization.id);

  if (error) {
    throw new Error("Unable to archive client.");
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "client",
    entityId: clientId,
    eventType: "client.archived",
    action: "archived",
    title: `Client archived: ${clientName}`,
    metadata: { clientId, name: clientName },
  });

  await fireWorkflowEngine({
    trigger: "client_archived",
    organizationId: session.organization.id,
    entityType: "client",
    entityId: clientId,
    clientId,
    actorUserId: session.user.id,
    payload: { title: clientName, status: "archived" },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/activity");

  if (options.redirectTo !== false) {
    redirect(options.redirectTo ?? "/clients");
  }
}

/** Permanently delete a client — Owner/Admin only. */
export async function deleteClientAction(clientId: string): Promise<void> {
  const session = await requireSession();
  const denied = assertPermissionSafe(session.role, "clients.write");
  if (denied) {
    throw new Error(denied.error);
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  if (!existing) {
    throw new Error("Client not found.");
  }

  const clientName = (existing as { name: string }).name;

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("organization_id", session.organization.id);

  if (error) {
    throw new Error("Unable to delete client.");
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "client",
    entityId: clientId,
    eventType: "client.deleted",
    action: "deleted",
    title: `Client deleted: ${clientName}`,
    metadata: { clientId, name: clientName },
  });

  revalidatePath("/clients");
  revalidatePath("/activity");
}
