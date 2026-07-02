"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import { analyzeIncident } from "@/lib/ai-incidents/analysis";
import { requireFeature } from "@/lib/plans/guards";
import { canEditIncident } from "@/lib/incidents/guards";
import { getIncidentById } from "@/lib/incidents/queries";
import { canAccessModule } from "@/lib/rbac/permissions";

export type IncidentAIActionState = {
  error?: string;
  success?: string;
};

/** Generate AI incident analysis in the background-friendly server action. */
export async function analyzeIncidentAction(incidentId: string): Promise<IncidentAIActionState> {
  try {
    const session = await requireSession();

    if (!canAccessModule(session.role, "incidents", "read")) {
      return { error: ACTION_DENIED_MESSAGE };
    }

    const planCheck = await requireFeature(session.organization.id, "ai_incident_assistant");
    if (!planCheck.allowed) {
      return { error: planCheck.message };
    }

    const incident = await getIncidentById(session, incidentId);
    if (!incident) {
      return { error: "Incident not found." };
    }

    if (!canEditIncident(session, incident)) {
      return { error: ACTION_DENIED_MESSAGE };
    }

    const result = await analyzeIncident(session, incidentId);
    if (!result) {
      return { error: "Unable to generate AI analysis. Try again or use mock provider." };
    }

    revalidatePath(`/incidents/${incidentId}`);
    return { success: "AI analysis generated." };
  } catch (error) {
    console.warn("[ai-incidents] analyzeIncidentAction failed:", error);
    return { error: "Unable to generate AI analysis." };
  }
}
