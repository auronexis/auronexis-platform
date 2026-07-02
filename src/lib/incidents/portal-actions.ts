"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import { canEditIncident } from "@/lib/incidents/guards";
import { getIncidentById } from "@/lib/incidents/queries";
import { createClient } from "@/lib/supabase/server";

export type IncidentPortalSettingsState = {
  error?: string;
  success?: string;
};

/** Update portal visibility and client-facing summary for an incident. */
export async function updateIncidentPortalSettingsAction(
  incidentId: string,
  _prev: IncidentPortalSettingsState,
  formData: FormData,
): Promise<IncidentPortalSettingsState> {
  try {
    const session = await requireSession();
    const incident = await getIncidentById(session, incidentId);

    if (!incident) {
      return { error: "Incident not found." };
    }

    if (!canEditIncident(session, incident)) {
      return { error: ACTION_DENIED_MESSAGE };
    }

    const portalVisible = formData.get("portal_visible") === "on";
    const clientSummary = String(formData.get("client_summary") ?? "").trim() || null;

    const supabase = await createClient();
    const { error } = await supabase
      .from("incidents")
      .update({
        portal_visible: portalVisible,
        client_summary: clientSummary,
      } as never)
      .eq("id", incidentId)
      .eq("organization_id", session.organization.id);

    if (error) {
      return { error: "Unable to update portal settings." };
    }

    revalidatePath(`/incidents/${incidentId}`);
    revalidatePath("/client-portal/incidents");
    return { success: "Portal settings updated." };
  } catch (error) {
    console.warn("[incidents] updateIncidentPortalSettingsAction failed:", error);
    return { error: "Unable to update portal settings." };
  }
}
