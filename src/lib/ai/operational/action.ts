"use server";

import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import { buildTrustedOperationalContext } from "@/lib/ai/operational/context-builder";
import { buildKnowledgeInfluenceNotice } from "@/lib/ai/knowledge/prompts";
import { buildOperationalAIPrompt, inferOperationalTargetField } from "@/lib/ai/operational/prompts";
import {
  buildOperationalChecklist,
  buildOperationalContextSnapshot,
  buildOperationalWarnings,
  buildRelatedItems,
  calculateOperationalConfidence,
  parseRiskAssessment,
} from "@/lib/ai/operational/quality";
import type {
  OperationalAIActionKey,
  OperationalAssistantResult,
  OperationalEntityType,
} from "@/lib/ai/operational/types";
import {
  mergeDevNotices,
  recordAIGenerationMetric,
  resolveAIProvider,
  timeAIContextBuild,
  toAIActionError,
  validateAIOutput,
} from "@/lib/ai/core";
import {
  AI_ACCESS_DENIED_MESSAGE,
  AIUserError,
} from "@/lib/ai/errors";
import { assertWithinAIUsageLimit, getAIUsageSummaryForPlan } from "@/lib/ai/usage/queries";
import { recordAIUsageEvent } from "@/lib/ai/usage/record";
import { requireSession } from "@/lib/auth/session";
import { canEditIncident, canCreateIncident } from "@/lib/incidents/guards";
import { getIncidentById } from "@/lib/incidents/queries";
import { assertCanUseFeature } from "@/lib/plans/guards";
import { getCurrentPlan } from "@/lib/plans/queries";
import { canEditRisk, canCreateRisk } from "@/lib/risks/guards";
import { getRiskById } from "@/lib/risks/queries";
import { canAccessModule } from "@/lib/rbac/permissions";

const entityTypeSchema = z.enum(["risk", "incident"]);

const fieldKeySchema = z.enum(["description", "resolution_notes"]);

const riskActionSchema = z.enum([
  "summarize_risk",
  "assess_business_impact",
  "assess_technical_impact",
  "generate_mitigation_plan",
  "generate_recommended_actions",
  "improve_description",
  "rewrite_professionally",
  "executive_explanation",
  "technical_explanation",
  "customer_friendly_explanation",
  "estimate_priority",
]);

const incidentActionSchema = z.enum([
  "summarize_incident",
  "generate_root_cause_analysis",
  "generate_investigation_notes",
  "generate_resolution_notes",
  "generate_customer_update",
  "generate_internal_update",
  "generate_timeline_summary",
  "suggest_escalation",
  "suggest_sla_impact",
  "recommend_next_actions",
]);

const fieldValuesSchema = z.object({
  description: z.string().max(50_000).optional(),
  resolution_notes: z.string().max(50_000).optional(),
});

const operationalInputSchema = z.object({
  entityType: entityTypeSchema,
  action: z.string(),
  entityId: z.string().uuid().optional(),
  clientId: z.string().uuid(),
  title: z.string().max(500),
  severity: z.string().max(32),
  status: z.string().max(32),
  assigneeUserId: z.string().uuid().nullable().optional(),
  dueDate: z.string().max(64).nullable().optional(),
  linkedRiskId: z.string().uuid().nullable().optional(),
  targetField: fieldKeySchema.nullable().optional(),
  fieldValues: fieldValuesSchema.default({}),
});

export type OperationalAssistantInput = z.infer<typeof operationalInputSchema>;

export type OperationalAssistantActionResult =
  | ({ ok: true } & OperationalAssistantResult)
  | { ok: false; error: string; code?: string; retryable?: boolean };

function featureForEntity(entityType: OperationalEntityType): "ai_risk_assistant" | "ai_incident_assistant" {
  return entityType === "risk" ? "ai_risk_assistant" : "ai_incident_assistant";
}

function moduleForEntity(entityType: OperationalEntityType): "risks" | "incidents" {
  return entityType === "risk" ? "risks" : "incidents";
}

async function assertEntityAccess(
  session: Awaited<ReturnType<typeof requireSession>>,
  input: OperationalAssistantInput,
) {
  if (input.entityId) {
    if (input.entityType === "risk") {
      const risk = await getRiskById(session, input.entityId);
      if (!risk || risk.client_id !== input.clientId) {
        throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
      }
      if (!canEditRisk(session, risk)) {
        throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
      }
    } else {
      const incident = await getIncidentById(session, input.entityId);
      if (!incident || incident.client_id !== input.clientId) {
        throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
      }
      if (!canEditIncident(session, incident)) {
        throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
      }
    }
  } else if (input.entityType === "risk") {
    if (!canCreateRisk(session)) throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
  } else if (!canCreateIncident(session)) {
    throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
  }
}

function toActionError(error: unknown): OperationalAssistantActionResult {
  return toAIActionError(error) as OperationalAssistantActionResult;
}

export async function runOperationalAssistantServerAction(
  input: OperationalAssistantInput,
): Promise<OperationalAssistantActionResult> {
  const started = Date.now();

  try {
    const session = await requireSession();
    const parsed = operationalInputSchema.safeParse(input);

    if (!parsed.success) {
      return { ok: false, error: "Invalid AI request. Please refresh and try again.", code: "validation", retryable: false };
    }

    const entityType = parsed.data.entityType;
    const targetModule = moduleForEntity(entityType);

    if (!canAccessModule(session.role, targetModule, "read")) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }

    const feature = featureForEntity(entityType);
    await assertCanUseFeature(session.organization.id, feature);
    await assertEntityAccess(session, parsed.data);

    const actionSchema = entityType === "risk" ? riskActionSchema : incidentActionSchema;
    const actionParsed = actionSchema.safeParse(parsed.data.action);
    if (!actionParsed.success) {
      return { ok: false, error: "Unsupported AI action.", code: "validation", retryable: false };
    }

    const action = actionParsed.data as OperationalAIActionKey;
    const planKey = await getCurrentPlan(session.organization.id);
    await assertWithinAIUsageLimit(session.organization.id, planKey);

    const { result: trustedContext, ms: contextBuildMs } = await timeAIContextBuild(() =>
      buildTrustedOperationalContext(session, {
        entityType,
        entityId: parsed.data.entityId,
        clientId: parsed.data.clientId,
        title: parsed.data.title,
        description: parsed.data.fieldValues.description ?? "",
        resolutionNotes: parsed.data.fieldValues.resolution_notes ?? "",
        severity: parsed.data.severity,
        status: parsed.data.status,
        assigneeUserId: parsed.data.assigneeUserId,
        dueDate: parsed.data.dueDate,
        linkedRiskId: parsed.data.linkedRiskId,
      }),
    );

    const prompt = buildOperationalAIPrompt(action, trustedContext, parsed.data.fieldValues);
    const { provider, devNotice } = resolveAIProvider();

    const providerStarted = Date.now();
    const response = await provider.generate({
      prompt,
      action: action as never,
      context: trustedContext as never,
    });
    const providerLatencyMs = Date.now() - providerStarted;

    const validationStarted = Date.now();
    const validated = validateAIOutput(response.content);
    const validationMs = Date.now() - validationStarted;
    if (!validated.valid) {
      recordAIGenerationMetric({
        module: entityType,
        action,
        organizationId: session.organization.id,
        startedAt: new Date(started).toISOString(),
        contextBuildMs,
        providerLatencyMs,
        validationMs,
        totalMs: Date.now() - started,
        success: false,
        retried: false,
        cancelled: false,
        timedOut: false,
        providerId: response.providerId,
        model: response.model,
      });
      throw new Error("invalid_response");
    }

    const inputTokens = response.usage?.promptTokens ?? null;
    const outputTokens = response.usage?.completionTokens ?? null;
    const totalTokens =
      inputTokens != null && outputTokens != null ? inputTokens + outputTokens : null;

    await recordAIUsageEvent({
      organizationId: session.organization.id,
      userId: session.user.id,
      feature,
      provider: response.providerId,
      model: response.model,
      inputTokens,
      outputTokens,
      totalTokens,
    });

    recordAIGenerationMetric({
      module: entityType,
      action,
      organizationId: session.organization.id,
      startedAt: new Date(started).toISOString(),
      contextBuildMs,
      providerLatencyMs,
      validationMs,
      totalMs: Date.now() - started,
      success: true,
      retried: false,
      cancelled: false,
      timedOut: false,
      providerId: response.providerId,
      model: response.model,
    });

    await recordActivityEvent({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      entityType: entityType === "risk" ? "risk" : "incident",
      entityId: parsed.data.entityId ?? null,
      action: "ai_operational_assistant_used",
      title: `AI ${entityType} copilot: ${action}`,
      metadata: { action, entityType, provider: response.providerId, model: response.model },
    });

    const usageSummary = await getAIUsageSummaryForPlan(session.organization.id, planKey);
    const targetField =
      parsed.data.targetField ?? inferOperationalTargetField(action);

    return {
      ok: true,
      content: validated.content,
      targetField,
      providerId: response.providerId,
      model: response.model,
      isPlaceholder: response.isPlaceholder,
      usageSummary,
      devNotice: mergeDevNotices(
        devNotice,
        buildKnowledgeInfluenceNotice(trustedContext.knowledgeSnippets ?? []),
      ),
      durationMs: Date.now() - started,
      warnings: buildOperationalWarnings(trustedContext),
      checklist: buildOperationalChecklist(trustedContext),
      relatedItems: buildRelatedItems(trustedContext),
      contextSnapshot: buildOperationalContextSnapshot(trustedContext),
      confidence: calculateOperationalConfidence(trustedContext),
      riskAssessment:
        action === "estimate_priority" ? parseRiskAssessment(response.content) : undefined,
      tokenUsage: { inputTokens, outputTokens, totalTokens },
    };
  } catch (error) {
    return toActionError(error);
  }
}
