"use server";

import { requireSession } from "@/lib/auth/session";
import { recordEnterpriseActivitySafe } from "@/lib/enterprise/activity";
import type { CreateEnterpriseRequestInput, EnterpriseRequestView } from "@/lib/enterprise/types";
import { getLatestEnterpriseRequest } from "@/lib/enterprise/queries";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { createClient } from "@/lib/supabase/server";
import type { EnterpriseRequest } from "@/types/database";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function toActionError(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

const OPEN_REQUEST_STATUSES = new Set(["new", "contacted", "qualified"]);

export async function createEnterpriseRequestAction(
  input: CreateEnterpriseRequestInput = {},
): Promise<ActionResult<EnterpriseRequestView>> {
  try {
    const session = await requireSession();

    if (!canManageOrganizationSettings(session)) {
      return { ok: false, error: "Only organization owners and admins can request Enterprise." };
    }

    const existing = await getLatestEnterpriseRequest(session.organization.id);
    if (existing && OPEN_REQUEST_STATUSES.has(existing.status)) {
      return { ok: true, data: existing };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("enterprise_requests")
      .insert({
        organization_id: session.organization.id,
        requested_by: session.user.id,
        contact_email: input.contactEmail?.trim() || session.user.email,
        company_name: input.companyName?.trim() || session.organization.name,
        requested_seats: input.requestedSeats ?? null,
        requested_clients: input.requestedClients ?? null,
        requested_features: input.requestedFeatures ?? [],
        notes: input.notes?.trim() || null,
        status: "new",
      } as never)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Unable to submit Enterprise request." };
    }

    const request = data as EnterpriseRequest;

    await recordEnterpriseActivitySafe({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      eventType: "enterprise.request_created",
      title: "Enterprise plan request submitted",
      metadata: { requestId: request.id },
    });

    return {
      ok: true,
      data: {
        id: request.id,
        organizationId: request.organization_id,
        requestedBy: request.requested_by,
        contactEmail: request.contact_email,
        companyName: request.company_name,
        requestedSeats: request.requested_seats,
        requestedClients: request.requested_clients,
        requestedFeatures: request.requested_features ?? [],
        notes: request.notes,
        status: request.status as EnterpriseRequestView["status"],
        handledBy: request.handled_by,
        handledAt: request.handled_at,
        createdAt: request.created_at,
        updatedAt: request.updated_at,
      },
    };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}
