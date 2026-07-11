"use server";

import { requireSession } from "@/lib/auth/session";
import {
  canGenerateExecutiveIntelligence,
  canRefreshExecutiveIntelligence,
} from "@/lib/executive-intelligence/guards";
import { generateGroundedExecutiveNarrative } from "@/lib/executive-intelligence/provider";
import { saveExecutiveBriefing } from "@/lib/executive-intelligence/queries";
import { clearExecutiveIntelligenceCacheForTests } from "@/lib/executive-intelligence/cache";
import type {
  ExecutiveIntelligenceActionResult,
  IntelligencePeriodPreset,
} from "@/lib/executive-intelligence/types";
import { checkPlanFeatureForSession } from "@/lib/plans";
import { getOrganizationPlanContextForSession } from "@/lib/plans/queries";

export async function refreshExecutiveIntelligenceAction(
  periodPreset: IntelligencePeriodPreset = "30d",
): Promise<ExecutiveIntelligenceActionResult> {
  try {
    const session = await requireSession();
    if (!canRefreshExecutiveIntelligence(session)) {
      return {
        success: false,
        error: "You do not have permission to refresh executive intelligence.",
        code: "forbidden",
      };
    }
    clearExecutiveIntelligenceCacheForTests();
    return { success: true, data: { periodPreset } };
  } catch {
    return { success: false, error: "Unable to refresh executive intelligence." };
  }
}

export async function generateExecutiveNarrativeAction(input: {
  snapshotJson: string;
  briefingJson: string;
}): Promise<ExecutiveIntelligenceActionResult> {
  try {
    const session = await requireSession();
    if (!canGenerateExecutiveIntelligence(session)) {
      return {
        success: false,
        error: "You do not have permission to generate narratives.",
        code: "forbidden",
      };
    }

    const [planContext, aiAccess] = await Promise.all([
      getOrganizationPlanContextForSession(session).catch(() => null),
      checkPlanFeatureForSession(session, "ai_report_assistant"),
    ]);

    const snapshot = JSON.parse(input.snapshotJson);
    const briefing = JSON.parse(input.briefingJson);
    const narrative = await generateGroundedExecutiveNarrative({
      session,
      snapshot,
      briefing,
      planKey: planContext?.planKey ?? "starter",
      aiAllowed: aiAccess.allowed,
    });

    await saveExecutiveBriefing({
      organizationId: session.organization.id,
      periodKey: snapshot.period.preset,
      periodStart: snapshot.period.currentStart,
      periodEnd: snapshot.period.currentEnd,
      comparisonStart: snapshot.period.comparisonStart,
      comparisonEnd: snapshot.period.comparisonEnd,
      snapshot,
      deterministicNarrative: briefing.narrative,
      aiNarrative: narrative.generatedBy === "ai_assisted" ? narrative.narrative : null,
      generatedBy: narrative.generatedBy,
      generatedByUserId: session.user.id,
      provider: narrative.provider,
      model: narrative.model,
      status: narrative.generatedBy === "ai_assisted" ? "generated" : "fallback",
    });

    return { success: true, data: narrative };
  } catch {
    return { success: false, error: "Unable to generate executive narrative." };
  }
}

export async function createExecutiveReportDraftAction(input: {
  title: string;
  narrative: string;
  periodLabel: string;
}): Promise<ExecutiveIntelligenceActionResult> {
  try {
    const session = await requireSession();
    if (!canGenerateExecutiveIntelligence(session)) {
      return {
        success: false,
        error: "You do not have permission to export briefings.",
        code: "forbidden",
      };
    }

    return {
      success: true,
      data: {
        copyText: [
          `# ${input.title}`,
          `Period: ${input.periodLabel}`,
          `Generated: ${new Date().toISOString()}`,
          "",
          input.narrative,
          "",
          "---",
          "Use Reports → New to create a draft and paste this content for review before publishing.",
        ].join("\n"),
      },
    };
  } catch {
    return { success: false, error: "Unable to prepare report draft content." };
  }
}
