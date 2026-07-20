import { listClients, getClientById } from "@/lib/clients/queries";
import { apiContextToSession } from "@/lib/api/resources/session";
import { recordApiAuditEvent } from "@/lib/api/audit";
import { dispatchWebhookEvent } from "@/lib/webhooks/events";
import type { ApiContext } from "@/lib/api/auth/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertCanCreateClient } from "@/lib/plans/guards";
import { z } from "zod";

const clientBodySchema = z.object({
  name: z.string().trim().min(2),
  status: z.enum(["active", "watch", "critical", "archived"]).optional(),
  ownerId: z.string().uuid().optional().nullable(),
  healthScore: z.number().int().min(0).max(100).optional().nullable(),
  contactName: z.string().trim().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

/** Public API create body — subset of clientBodySchema used by POST /clients. */
export const clientCreateBodySchema = clientBodySchema.pick({
  name: true,
  status: true,
  contactName: true,
  contactEmail: true,
  notes: true,
});

/** Public API update body — partial create fields. */
export const clientUpdateBodySchema = clientCreateBodySchema.partial();

export async function apiListClients(
  ctx: ApiContext,
  options?: { status?: string; search?: string },
) {
  const session = apiContextToSession(ctx);
  return listClients(session, {
    status: clientBodySchema.shape.status.safeParse(options?.status).success
      ? (options?.status as "active" | "watch" | "critical" | "archived")
      : undefined,
    search: options?.search,
  });
}

export async function apiGetClient(ctx: ApiContext, clientId: string) {
  const session = apiContextToSession(ctx);
  return getClientById(session, clientId);
}

export async function apiCreateClient(ctx: ApiContext, body: unknown) {
  const parsed = clientBodySchema.parse(body);
  const limit = await assertCanCreateClient(ctx.organization.id, ctx.userId ?? ctx.organization.id);
  if (!limit.allowed) {
    throw new Error(limit.message ?? "Client limit reached.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("clients")
    .insert({
      organization_id: ctx.organization.id,
      name: parsed.name,
      status: parsed.status ?? "active",
      owner_id: parsed.ownerId ?? null,
      health_score: parsed.healthScore ?? null,
      contact_name: parsed.contactName ?? null,
      contact_email: parsed.contactEmail ?? null,
      notes: parsed.notes ?? null,
    } as never)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Unable to create client.");
  }

  const created = data as { id: string; name: string; status: string };
  await recordApiAuditEvent({
    organizationId: ctx.organization.id,
    actorUserId: ctx.userId,
    entityType: "client",
    entityId: created.id,
    action: "created",
    title: `Client created via API: ${created.name}`,
  });
  await dispatchWebhookEvent({
    organizationId: ctx.organization.id,
    eventType: "client.created",
    payload: { id: created.id, name: created.name, status: created.status },
  });

  return created;
}

export async function apiUpdateClient(ctx: ApiContext, clientId: string, body: unknown) {
  const parsed = clientBodySchema.partial().parse(body);
  const admin = createAdminClient();

  if (parsed.status && parsed.status !== "archived") {
    const { data: existing } = await admin
      .from("clients")
      .select("status")
      .eq("id", clientId)
      .eq("organization_id", ctx.organization.id)
      .maybeSingle();

    const previousStatus = (existing as { status?: string } | null)?.status;
    if (previousStatus === "archived") {
      const limit = await assertCanCreateClient(
        ctx.organization.id,
        ctx.userId ?? ctx.organization.id,
      );
      if (!limit.allowed) {
        throw new Error(limit.message ?? "Client limit reached.");
      }
    }
  }

  const { data, error } = await admin
    .from("clients")
    .update({
      ...(parsed.name ? { name: parsed.name } : {}),
      ...(parsed.status ? { status: parsed.status } : {}),
      ...(parsed.ownerId !== undefined ? { owner_id: parsed.ownerId } : {}),
      ...(parsed.healthScore !== undefined ? { health_score: parsed.healthScore } : {}),
      ...(parsed.contactName !== undefined ? { contact_name: parsed.contactName } : {}),
      ...(parsed.contactEmail !== undefined ? { contact_email: parsed.contactEmail } : {}),
      ...(parsed.notes !== undefined ? { notes: parsed.notes } : {}),
    } as never)
    .eq("id", clientId)
    .eq("organization_id", ctx.organization.id)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    throw new Error("Client not found.");
  }

  const updated = data as { id: string; name: string; status: string };
  await dispatchWebhookEvent({
    organizationId: ctx.organization.id,
    eventType: "client.updated",
    payload: { id: updated.id, name: updated.name, status: updated.status },
  }).catch(() => undefined);

  return data;
}

export async function apiArchiveClient(ctx: ApiContext, clientId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("clients")
    .update({ status: "archived" } as never)
    .eq("id", clientId)
    .eq("organization_id", ctx.organization.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error("Client not found.");
  }

  return { id: clientId, status: "archived" };
}
