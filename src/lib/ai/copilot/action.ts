"use server";

import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import {
  loadClientCopilotContext,
  serializeClientContext,
} from "@/lib/ai/copilot/context/client-context";
import { loadExecutiveBriefContext } from "@/lib/ai/copilot/context/executive-context";
import {
  loadWorkspaceCopilotContext,
  serializeWorkspaceContext,
} from "@/lib/ai/copilot/context/workspace-context";
import {
  buildCopilotRetryPrompt,
  buildCopilotSystemPrompt,
  buildCopilotUserPrompt,
} from "@/lib/ai/copilot/prompts";
import { buildSafeCopilotFallback, parseCopilotAnswer } from "@/lib/ai/copilot/schema";
import { sanitizeUserPrompt } from "@/lib/ai/copilot/safety";
import {
  COPILOT_FEATURE,
  COPILOT_USAGE_FEATURE,
  MAX_COPILOT_HISTORY_TURNS,
  type CopilotActionResult,
  type CopilotErrorCode,
  type CopilotHistoryTurn,
  type CopilotTaskType,
} from "@/lib/ai/copilot/types";
import {
  mergeDevNotices,
  recordAIGenerationMetric,
  resolveAIProvider,
  timeAIContextBuild,
  toAIActionError,
} from "@/lib/ai/core";
import {
  AI_ACCESS_DENIED_MESSAGE,
  AI_PLAN_RESTRICTED_MESSAGE,
  AIUserError,
  type AIErrorCode,
} from "@/lib/ai/errors";
import { getAIConfig } from "@/lib/ai/server/config";
import { assertWithinAIUsageLimit, getAIUsageSummaryForPlan } from "@/lib/ai/usage/queries";
import { recordAIUsageEvent } from "@/lib/ai/usage/record";
import { requireSession } from "@/lib/auth/session";
import { getClientById } from "@/lib/clients/queries";
import { getIncidentById } from "@/lib/incidents/queries";
import { assertCanUseFeature, checkPlanFeatureForSession } from "@/lib/plans/guards";
import { getFeatureUpgradeMessage, getRequiredPlanLabel } from "@/lib/plans/features";
import { getCurrentPlan } from "@/lib/plans/queries";
import { canAccessModule } from "@/lib/rbac/permissions";
import { getRiskById } from "@/lib/risks/queries";
import type { ReportAIContext } from "@/lib/ai/types";

const taskTypeSchema = z.enum([
  "workspace_question",
  "client_summary",
  "executive_brief",
  "risk_explanation",
  "incident_explanation",
  "sla_explanation",
]);

const historyTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(4_000),
});

const copilotInputSchema = z.object({
  taskType: taskTypeSchema,
  prompt: z.string().max(2_000).optional(),
  clientId: z.string().uuid().optional(),
  riskId: z.string().uuid().optional(),
  incidentId: z.string().uuid().optional(),
  reportId: z.string().uuid().optional(),
  history: z.array(historyTurnSchema).max(MAX_COPILOT_HISTORY_TURNS).optional(),
});

export type AskCopilotInput = z.infer<typeof copilotInputSchema>;

function mapToCopilotCode(code: AIErrorCode): CopilotErrorCode {
  switch (code) {
    case "plan_restricted":
      return "PLAN_REQUIRED";
    case "access_denied":
      return "PERMISSION_DENIED";
    case "rate_limit":
      return "CREDITS_EXHAUSTED";
    case "timeout":
      return "PROVIDER_TIMEOUT";
    case "provider_unavailable":
      return "PROVIDER_UNAVAILABLE";
    case "invalid_response":
    case "parsing_failed":
      return "INVALID_PROVIDER_RESPONSE";
    case "validation":
    case "missing_context":
      return "INVALID_REQUEST";
    default:
      if (code === "provider_error") {
        return "GENERIC_AI_ERROR";
      }
      return "GENERIC_AI_ERROR";
  }
}

function toCopilotFailure(error: unknown): CopilotActionResult {
  const mapped = toAIActionError(error);
  return {
    ok: false,
    error: mapped.error,
    code: mapToCopilotCode(mapped.code),
    retryable: mapped.retryable,
  };
}

function assertCopilotPermission(
  session: Awaited<ReturnType<typeof requireSession>>,
  taskType: CopilotTaskType,
  clientId?: string,
): void {
  if (taskType === "client_summary" || taskType === "sla_explanation") {
    if (!canAccessModule(session.role, "clients", "read")) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }
    if (!clientId) {
      throw new AIUserError("A client must be selected for this analysis.", "validation");
    }
    return;
  }

  if (taskType === "risk_explanation") {
    if (!canAccessModule(session.role, "risks", "read")) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }
    return;
  }

  if (taskType === "incident_explanation") {
    if (!canAccessModule(session.role, "incidents", "read")) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }
    return;
  }

  if (!canAccessModule(session.role, "dashboard", "read")) {
    throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
  }
}

async function loadEvidence(
  session: Awaited<ReturnType<typeof requireSession>>,
  input: AskCopilotInput,
): Promise<string> {
  switch (input.taskType) {
    case "client_summary":
    case "sla_explanation": {
      if (!input.clientId) {
        throw new AIUserError("Client not found.", "missing_context");
      }
      const context = await loadClientCopilotContext(session, input.clientId);
      if (!context) {
        throw new AIUserError("Client not found in your organization.", "missing_context");
      }
      return serializeClientContext(context);
    }
    case "executive_brief":
      return loadExecutiveBriefContext(session);
    case "risk_explanation": {
      if (!input.riskId) {
        throw new AIUserError("Risk not found.", "missing_context");
      }
      const risk = await getRiskById(session, input.riskId);
      if (!risk) {
        throw new AIUserError("Risk not found in your organization.", "missing_context");
      }
      const client = await getClientById(session, risk.client_id);
      return JSON.stringify({
        risk: {
          id: risk.id,
          title: risk.title,
          severity: risk.severity,
          status: risk.status,
          description: risk.description?.slice(0, 2_000) ?? null,
          due_at: risk.due_at,
          assignee_user_id: risk.owner_user_id,
        },
        client: client ? { id: client.id, name: client.name } : null,
      });
    }
    case "incident_explanation": {
      if (!input.incidentId) {
        throw new AIUserError("Incident not found.", "missing_context");
      }
      const incident = await getIncidentById(session, input.incidentId);
      if (!incident) {
        throw new AIUserError("Incident not found in your organization.", "missing_context");
      }
      const client = await getClientById(session, incident.client_id);
      return JSON.stringify({
        incident: {
          id: incident.id,
          title: incident.title,
          severity: incident.severity,
          status: incident.status,
          description: incident.description?.slice(0, 2_000) ?? null,
          resolution_notes: incident.resolution_notes?.slice(0, 2_000) ?? null,
          due_at: incident.due_at,
          assignee_user_id: incident.assigned_user_id,
        },
        client: client ? { id: client.id, name: client.name } : null,
      });
    }
    default: {
      const context = await loadWorkspaceCopilotContext(session);
      return serializeWorkspaceContext(context);
    }
  }
}

function serializeHistory(history: CopilotHistoryTurn[] | undefined): string | undefined {
  if (!history || history.length === 0) return undefined;
  return history
    .slice(-MAX_COPILOT_HISTORY_TURNS)
    .map((turn) => `${turn.role.toUpperCase()}: ${turn.content.slice(0, 800)}`)
    .join("\n");
}

function isProviderConfigured(): boolean {
  const config = getAIConfig();
  if (config.providerId === "placeholder") return false;
  if (config.providerId === "openai") return Boolean(config.openaiApiKey);
  return true;
}

function buildMinimalReportContext(
  session: Awaited<ReturnType<typeof requireSession>>,
): ReportAIContext {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).toISOString();

  return {
    reportTitle: "Ask Auroranexis",
    clientId: "00000000-0000-0000-0000-000000000000",
    clientName: "Workspace",
    organizationName: session.organization.name,
    periodLabel: "Current period",
    reportingPeriodStart: monthStart,
    reportingPeriodEnd: monthEnd,
    executiveSummary: "",
    businessSummary: "",
    keyWins: "",
    keyRisks: "",
    nextActions: "",
    recommendations: "",
    customerHighlights: "",
    operationalHealthSummary: "",
    managementSummary: "",
    openRisks: [],
    openIncidents: [],
    knowledgeSnippets: [],
  };
}

async function invokeProvider(
  session: Awaited<ReturnType<typeof requireSession>>,
  systemPrompt: string,
  userPrompt: string,
): Promise<{ content: string; providerId: string; model: string; isPlaceholder: boolean; usage?: { promptTokens: number; completionTokens: number } }> {
  const { provider } = resolveAIProvider();
  const response = await provider.generate({
    prompt: `${systemPrompt}\n\n${userPrompt}`,
    action: "generate_summary",
    section: "executive_summary",
    context: buildMinimalReportContext(session),
  });

  return {
    content: response.content,
    providerId: response.providerId,
    model: response.model,
    isPlaceholder: response.isPlaceholder,
    usage: response.usage
      ? {
          promptTokens: response.usage.promptTokens,
          completionTokens: response.usage.completionTokens,
        }
      : undefined,
  };
}

/** Primary Ask Auroranexis server action — tenant-safe, credit-aware. */
export async function askCopilotServerAction(input: AskCopilotInput): Promise<CopilotActionResult> {
  const started = Date.now();

  try {
    const session = await requireSession();
    const parsed = copilotInputSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: "Invalid AI request. Please refresh and try again.",
        code: "INVALID_REQUEST",
        retryable: false,
      };
    }

    const data = parsed.data;
    const userPrompt = sanitizeUserPrompt(data.prompt ?? "");

    if (
      (data.taskType === "workspace_question" || data.taskType === "executive_brief") &&
      !userPrompt &&
      data.taskType === "workspace_question"
    ) {
      return {
        ok: false,
        error: "Enter a question or choose a suggested prompt.",
        code: "INVALID_REQUEST",
        retryable: false,
      };
    }

    await assertCanUseFeature(session.organization.id, COPILOT_FEATURE);
    assertCopilotPermission(session, data.taskType, data.clientId);

    const providerConfigured = isProviderConfigured();
    if (!providerConfigured && process.env.NODE_ENV === "production") {
      return {
        ok: false,
        error: "AI is not configured for this workspace. Contact your administrator.",
        code: "AI_NOT_CONFIGURED",
        retryable: false,
      };
    }

    const planKey = await getCurrentPlan(session.organization.id);

    const { result: evidence, ms: contextBuildMs } = await timeAIContextBuild(() =>
      loadEvidence(session, data),
    );

    await assertWithinAIUsageLimit(session.organization.id, planKey);

    const systemPrompt = buildCopilotSystemPrompt();
    const historyBlock = serializeHistory(data.history);
    const userPromptBody = buildCopilotUserPrompt(
      data.taskType,
      userPrompt,
      evidence.slice(0, 28_000),
      historyBlock,
    );

    const { devNotice } = resolveAIProvider();
    const providerStarted = Date.now();
    let generation = await invokeProvider(session, systemPrompt, userPromptBody);
    const providerLatencyMs = Date.now() - providerStarted;

    let answer = parseCopilotAnswer(generation.content);

    if (!answer) {
      const retryPrompt = buildCopilotRetryPrompt(generation.content);
      generation = await invokeProvider(session, systemPrompt, retryPrompt);
      answer = parseCopilotAnswer(generation.content);
    }

    if (!answer) {
      answer = buildSafeCopilotFallback(
        generation.isPlaceholder
          ? "AI provider is not fully configured — placeholder output could not be structured."
          : "The AI response did not match the required structured schema.",
      );
    }

    const inputTokens = generation.usage?.promptTokens ?? null;
    const outputTokens = generation.usage?.completionTokens ?? null;
    const totalTokens =
      inputTokens != null && outputTokens != null ? inputTokens + outputTokens : null;

    await recordAIUsageEvent({
      organizationId: session.organization.id,
      userId: session.user.id,
      feature: COPILOT_USAGE_FEATURE,
      provider: generation.providerId,
      model: generation.model,
      inputTokens,
      outputTokens,
      totalTokens,
    });

    recordAIGenerationMetric({
      module: "copilot",
      action: data.taskType,
      organizationId: session.organization.id,
      startedAt: new Date(started).toISOString(),
      contextBuildMs,
      providerLatencyMs,
      validationMs: 0,
      totalMs: Date.now() - started,
      success: true,
      retried: false,
      cancelled: false,
      timedOut: false,
      providerId: generation.providerId,
      model: generation.model,
    });

    await recordActivityEvent({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      entityType: "organization",
      entityId: null,
      action: "ai_copilot_used",
      title: `Ask Auroranexis: ${data.taskType}`,
      metadata: {
        taskType: data.taskType,
        clientId: data.clientId ?? null,
        riskId: data.riskId ?? null,
        incidentId: data.incidentId ?? null,
        provider: generation.providerId,
        model: generation.model,
        confidence: answer.confidence,
      },
    });

    const usageSummary = await getAIUsageSummaryForPlan(session.organization.id, planKey);

    return {
      ok: true,
      answer,
      taskType: data.taskType,
      usageSummary,
      providerConfigured,
      isPlaceholder: generation.isPlaceholder,
      devNotice: mergeDevNotices(devNotice, null) ?? null,
      durationMs: Date.now() - started,
    };
  } catch (error) {
    if (error instanceof AIUserError && error.message === AI_PLAN_RESTRICTED_MESSAGE) {
      return {
        ok: false,
        error: "Ask Auroranexis is not available on your current plan.",
        code: "PLAN_REQUIRED",
        retryable: false,
      };
    }

    recordAIGenerationMetric({
      module: "copilot",
      action: "unknown",
      organizationId: "unknown",
      startedAt: new Date(started).toISOString(),
      contextBuildMs: 0,
      providerLatencyMs: 0,
      validationMs: 0,
      totalMs: Date.now() - started,
      success: false,
      retried: false,
      cancelled: false,
      timedOut: false,
      providerId: "unknown",
      model: "unknown",
    });

    return toCopilotFailure(error);
  }
}

export async function getCopilotAccessForSession(): Promise<{
  allowed: boolean;
  message: string;
  requiredPlanLabel: string;
  providerConfigured: boolean;
}> {
  const session = await requireSession();
  const access = await checkPlanFeatureForSession(session, COPILOT_FEATURE);

  return {
    allowed: access.allowed,
    message: getFeatureUpgradeMessage(COPILOT_FEATURE),
    requiredPlanLabel: getRequiredPlanLabel(COPILOT_FEATURE),
    providerConfigured: isProviderConfigured(),
  };
}
