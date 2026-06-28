"use server";

import { recordActivityEvent } from "@/lib/activity/record";
import { toAIActionError } from "@/lib/ai/core";
import { AI_ACCESS_DENIED_MESSAGE, AIUserError } from "@/lib/ai/errors";
import {
  refreshClientPredictiveAnalysis,
  refreshPredictiveIntelligence,
} from "@/lib/predictive/cache";
import type {
  ClientPredictiveAnalysis,
  PredictiveIntelligenceResult,
} from "@/lib/predictive/types";
import { requireSession } from "@/lib/auth/session";
import { assertCanUseFeature } from "@/lib/plans/guards";
import { canAccessModule } from "@/lib/rbac/permissions";

export type RefreshPredictiveIntelligenceResult =
  | { ok: true; data: PredictiveIntelligenceResult }
  | { ok: false; error: string; retryable?: boolean };

export type RefreshClientPredictiveResult =
  | { ok: true; data: ClientPredictiveAnalysis }
  | { ok: false; error: string; retryable?: boolean };

function toError(error: unknown) {
  return toAIActionError(error);
}

export async function refreshPredictiveIntelligenceServerAction(): Promise<RefreshPredictiveIntelligenceResult> {
  try {
    const session = await requireSession();

    if (!canAccessModule(session.role, "dashboard", "read")) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }

    await assertCanUseFeature(session.organization.id, "ai_predictive_intelligence");

    const data = await refreshPredictiveIntelligence(session);

    await recordActivityEvent({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      entityType: "organization",
      entityId: session.organization.id,
      action: "predictive_intelligence_refreshed",
      title: "Predictive intelligence refreshed",
      metadata: {
        forecastCount: data.forecastCount,
        confidence: data.overallConfidence.score,
        engineVersion: data.engineVersion,
      },
    });

    return { ok: true, data };
  } catch (error) {
    return toError(error);
  }
}

export async function refreshClientPredictiveServerAction(
  clientId: string,
): Promise<RefreshClientPredictiveResult> {
  try {
    const session = await requireSession();

    if (!canAccessModule(session.role, "clients", "read")) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }

    await assertCanUseFeature(session.organization.id, "ai_predictive_intelligence");

    const data = await refreshClientPredictiveAnalysis(session, clientId);
    if (!data) {
      return { ok: false, error: "Client not found.", retryable: false };
    }

    await recordActivityEvent({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      entityType: "client",
      entityId: clientId,
      action: "predictive_intelligence_refreshed",
      title: `Predictive intelligence refreshed — ${data.clientName}`,
      metadata: {
        confidence: data.confidence.score,
        churnProbability: data.churnProbability,
        engineVersion: data.engineVersion,
      },
    });

    return { ok: true, data };
  } catch (error) {
    return toError(error);
  }
}
