"use server";

import { recordActivityEvent } from "@/lib/activity/record";
import { toAIActionError } from "@/lib/ai/core";
import {
  AI_ACCESS_DENIED_MESSAGE,
  AIUserError,
} from "@/lib/ai/errors";
import { refreshOperationalIntelligence } from "@/lib/ai/insights/get-intelligence";
import type { OperationalIntelligenceResult } from "@/lib/ai/insights/types";
import { requireSession } from "@/lib/auth/session";
import { assertCanUseFeature } from "@/lib/plans/guards";
import { canAccessModule } from "@/lib/rbac/permissions";

export type RefreshOperationalInsightsResult =
  | { ok: true; data: OperationalIntelligenceResult }
  | { ok: false; error: string; retryable?: boolean };

function toError(error: unknown): RefreshOperationalInsightsResult {
  return toAIActionError(error);
}

/** Refresh operational intelligence for the insights panel. */
export async function refreshOperationalInsightsServerAction(): Promise<RefreshOperationalInsightsResult> {
  try {
    const session = await requireSession();

    if (!canAccessModule(session.role, "dashboard", "read")) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }

    await assertCanUseFeature(session.organization.id, "ai_report_assistant");

    const data = await refreshOperationalIntelligence(session);

    await recordActivityEvent({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      entityType: "organization",
      entityId: session.organization.id,
      action: "ai_operational_insights_refreshed",
      title: "AI operational insights refreshed",
      metadata: {
        insightCount: data.insights.length,
        workspaceHealth: data.workspaceHealth.score,
        provider: data.providerId,
        model: data.model,
      },
    });

    return { ok: true, data };
  } catch (error) {
    return toError(error);
  }
}
