"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import { analyzeRisk } from "@/lib/ai-risks/analysis";
import { requireFeature } from "@/lib/plans/guards";
import { canEditRisk } from "@/lib/risks/guards";
import { getRiskById } from "@/lib/risks/queries";
import { canAccessModule } from "@/lib/rbac/permissions";

export type RiskAIActionState = {
  error?: string;
  success?: string;
};

/** Generate AI risk analysis in the background-friendly server action. */
export async function analyzeRiskAction(riskId: string): Promise<RiskAIActionState> {
  try {
    const session = await requireSession();

    if (!canAccessModule(session.role, "risks", "read")) {
      return { error: ACTION_DENIED_MESSAGE };
    }

    const planCheck = await requireFeature(session.organization.id, "ai_risk_assistant");
    if (!planCheck.allowed) {
      return { error: planCheck.message };
    }

    const risk = await getRiskById(session, riskId);
    if (!risk) {
      return { error: "Risk not found." };
    }

    if (!canEditRisk(session, risk)) {
      return { error: ACTION_DENIED_MESSAGE };
    }

    const result = await analyzeRisk(session, riskId);
    if (!result) {
      return { error: "Unable to generate AI analysis. Try again or use mock provider." };
    }

    revalidatePath(`/risks/${riskId}`);
    return { success: "AI analysis generated." };
  } catch (error) {
    console.warn("[ai-risks] analyzeRiskAction failed:", error);
    return { error: "Unable to generate AI analysis." };
  }
}
