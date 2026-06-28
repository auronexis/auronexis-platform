"use server";

import { recordActivityEvent } from "@/lib/activity/record";
import { toAIActionError } from "@/lib/ai/core";
import {
  AI_ACCESS_DENIED_MESSAGE,
  AIUserError,
} from "@/lib/ai/errors";
import {
  refreshClientSuccessAnalysis,
  refreshClientSuccessPortfolio,
} from "@/lib/ai/client-success/get-analysis";
import type { ClientSuccessAnalysis, ClientSuccessPortfolioResult } from "@/lib/ai/client-success/types";
import { recordAIUsageEvent } from "@/lib/ai/usage/record";
import { requireSession } from "@/lib/auth/session";
import { assertCanUseFeature } from "@/lib/plans/guards";
import { canAccessModule } from "@/lib/rbac/permissions";

export type RefreshClientSuccessResult =
  | { ok: true; data: ClientSuccessAnalysis }
  | { ok: false; error: string; retryable?: boolean };

export type RefreshClientPortfolioResult =
  | { ok: true; data: ClientSuccessPortfolioResult }
  | { ok: false; error: string; retryable?: boolean };

function toError(error: unknown) {
  return toAIActionError(error);
}

async function recordUsage(
  session: Awaited<ReturnType<typeof requireSession>>,
  feature: "ai_client_success" | "ai_client_analysis",
  durationMs: number,
) {
  await recordAIUsageEvent({
    organizationId: session.organization.id,
    userId: session.user.id,
    feature,
    provider: "client-success-engine",
    model: "rules-v1",
    inputTokens: null,
    outputTokens: null,
    totalTokens: null,
  });

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "client",
    entityId: null,
    action: "ai_client_success_refreshed",
    title: `AI client success: ${feature}`,
    metadata: { feature, durationMs },
  });
}

export async function refreshClientSuccessServerAction(
  clientId: string,
): Promise<RefreshClientSuccessResult> {
  try {
    const session = await requireSession();

    if (!canAccessModule(session.role, "clients", "read")) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }

    await assertCanUseFeature(session.organization.id, "ai_client_success");

    const data = await refreshClientSuccessAnalysis(session, clientId);
    if (!data) {
      return { ok: false, error: "Client not found.", retryable: false };
    }

    await recordUsage(session, "ai_client_success", data.durationMs);
    return { ok: true, data };
  } catch (error) {
    return toError(error);
  }
}

export async function refreshClientPortfolioServerAction(): Promise<RefreshClientPortfolioResult> {
  try {
    const session = await requireSession();

    if (!canAccessModule(session.role, "clients", "read")) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }

    await assertCanUseFeature(session.organization.id, "ai_client_analysis");

    const data = await refreshClientSuccessPortfolio(session);
    await recordUsage(session, "ai_client_analysis", data.durationMs);
    return { ok: true, data };
  } catch (error) {
    return toError(error);
  }
}
