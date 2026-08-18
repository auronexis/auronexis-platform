"use server";

import { requireSession } from "@/lib/auth/session";
import { SALES_EMAIL } from "@/lib/company/company-contact";
import { recordEnterpriseActivitySafe } from "@/lib/enterprise/activity";
import { sendEnterpriseRequestNotificationEmail } from "@/lib/enterprise/notify";
import type { CreateEnterpriseRequestInput, EnterpriseRequestView } from "@/lib/enterprise/types";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { createClient } from "@/lib/supabase/server";
import type { EnterpriseRequest } from "@/types/database";

type ActionResult =
  | { ok: true; data: EnterpriseRequestView; delivery: "persisted" }
  | { ok: true; data: null; delivery: "email_only" }
  | { ok: false; error: string };

const SAFE_SUBMIT_ERROR = `Unable to submit Enterprise request. Please try again or email ${SALES_EMAIL}.`;

function toView(request: EnterpriseRequest): EnterpriseRequestView {
  return {
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
  };
}

/**
 * Persist Enterprise request then notify Sales.
 * Failure policy:
 * - DB ok → success (email best-effort; keep durable request if email fails)
 * - DB fail + email ok → success without fabricating a DB row (email_only)
 * - DB fail + email fail → safe error (never fake success)
 */
export async function createEnterpriseRequestAction(
  input: CreateEnterpriseRequestInput = {},
): Promise<ActionResult> {
  const correlationId = crypto.randomUUID();

  try {
    const session = await requireSession();

    if (!canManageOrganizationSettings(session)) {
      return { ok: false, error: "Only organization owners and admins can request Enterprise." };
    }

    const contactEmail = input.contactEmail?.trim() || session.user.email;
    const companyName = input.companyName?.trim() || session.organization.name;
    const requestedSeats = input.requestedSeats ?? null;
    const requestedClients = input.requestedClients ?? null;
    const notes = input.notes?.trim() || null;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("enterprise_requests")
      .insert({
        organization_id: session.organization.id,
        requested_by: session.user.id,
        contact_email: contactEmail,
        company_name: companyName,
        requested_seats: requestedSeats,
        requested_clients: requestedClients,
        requested_features: input.requestedFeatures ?? [],
        notes,
        status: "new",
      } as never)
      .select("*")
      .single();

    if (error || !data) {
      console.error(
        `[enterprise] Request insert failed (${correlationId}):`,
        error?.message ?? "unknown insert error",
      );

      const emailed = await sendEnterpriseRequestNotificationEmail({
        contactEmail,
        companyName,
        requestedSeats,
        requestedClients,
        notes,
        organizationId: session.organization.id,
        requestId: null,
        persistFailed: true,
        correlationId,
      });

      if (emailed) {
        console.error(
          `[enterprise] Request delivered by email only; database persist failed (${correlationId})`,
        );
        return { ok: true, data: null, delivery: "email_only" };
      }

      console.error(
        `[enterprise] Request capture failed on both persist and email (${correlationId})`,
      );
      return { ok: false, error: SAFE_SUBMIT_ERROR };
    }

    const request = data as EnterpriseRequest;

    await recordEnterpriseActivitySafe({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      eventType: "enterprise.request_created",
      title: "Enterprise plan request submitted",
      metadata: { requestId: request.id, correlationId },
    });

    const emailed = await sendEnterpriseRequestNotificationEmail({
      contactEmail: request.contact_email ?? session.user.email,
      companyName: request.company_name ?? session.organization.name,
      requestedSeats: request.requested_seats,
      requestedClients: request.requested_clients,
      notes: request.notes,
      organizationId: request.organization_id,
      requestId: request.id,
      persistFailed: false,
      correlationId,
    });

    if (!emailed) {
      console.error(
        `[enterprise] Request persisted but notification email failed; durable request retained (${correlationId}, requestId=${request.id})`,
      );
    }

    return {
      ok: true,
      data: toView(request),
      delivery: "persisted",
    };
  } catch (error) {
    console.error(
      `[enterprise] Request action failed (${correlationId}):`,
      error instanceof Error ? error.message : "unknown",
    );
    return { ok: false, error: SAFE_SUBMIT_ERROR };
  }
}
