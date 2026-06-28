"use server";

import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import { buildTrustedReportAIContext } from "@/lib/ai/context-builder";
import {
  buildAIWarnings,
  buildContextSnapshot,
  calculateConfidence,
} from "@/lib/ai/copilot/quality";
import { buildSmartSuggestions } from "@/lib/ai/copilot/suggestions";
import {
  ENTIRE_REPORT_SECTIONS,
  actionForSection,
  inferTargetSection,
  normalizeAction,
} from "@/lib/ai/copilot/sections";
import {
  AI_ACCESS_DENIED_MESSAGE,
  AI_GENERIC_ERROR_MESSAGE,
  AI_PLAN_RESTRICTED_MESSAGE,
  AI_RATE_LIMIT_MESSAGE,
  AIUserError,
} from "@/lib/ai/errors";
import {
  mergeDevNotices,
  recordAIGenerationMetric,
  timeAIContextBuild,
  toAIActionError,
  validateAIOutput,
} from "@/lib/ai/core";
import { buildReportAIPrompt } from "@/lib/ai/prompts";
import { buildKnowledgeInfluenceNotice } from "@/lib/ai/knowledge/prompts";
import { resolveAIProvider } from "@/lib/ai/server/resolve-provider";
import {
  REPORT_AI_ACTION_LABELS,
  type AIConfidenceScore,
  type AISmartSuggestion,
  type AIUsageSummary,
  type AIWarning,
  type EntireReportSectionResult,
  type ReportAIActionKey,
  type ReportAIContextSnapshot,
  type ReportAISectionKey,
  type ReportAIStyleMode,
} from "@/lib/ai/types";
import {
  assertWithinAIUsageLimit,
  getAIUsageSummaryForPlan,
  getOrganizationAIMonthlyUsageCount,
} from "@/lib/ai/usage/queries";
import { getAIUsageLimit } from "@/lib/ai/usage/limits";
import { recordAIUsageEvent } from "@/lib/ai/usage/record";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { assertCanUseFeature } from "@/lib/plans/guards";
import { getCurrentPlan } from "@/lib/plans/queries";
import { canCreateReport, canEditReport } from "@/lib/reports/guards";
import { getReportById } from "@/lib/reports/queries";
import { canAccessModule } from "@/lib/rbac/permissions";

const reportAISectionSchema = z.enum([
  "executive_summary",
  "business_summary",
  "key_wins",
  "key_risks",
  "next_actions",
  "recommendations",
  "customer_highlights",
  "operational_health_summary",
  "management_summary",
  "customer_email",
  "meeting_agenda",
]);

const reportAIActionSchema = z.enum([
  "generate_executive_summary",
  "generate_business_summary",
  "generate_key_wins",
  "generate_key_risks",
  "generate_next_actions",
  "generate_recommendations",
  "generate_entire_report",
  "rewrite_professionally",
  "rewrite_shorter",
  "rewrite_longer",
  "explain_technically",
  "explain_for_executives",
  "generate_customer_email",
  "generate_meeting_agenda",
  "generate_customer_highlights",
  "generate_operational_health",
  "generate_management_summary",
  "generate_summary",
  "improve_writing",
  "shorten",
  "expand",
  "tone_professional",
  "tone_executive",
  "tone_technical",
  "generate_risks",
  "generate_wins",
]);

const reportAIStyleSchema = z.enum([
  "executive",
  "technical",
  "customer_friendly",
  "formal",
  "concise",
  "detailed",
]);

const fieldValuesSchema = z.object({
  executive_summary: z.string().max(50_000).optional(),
  business_summary: z.string().max(50_000).optional(),
  key_wins: z.string().max(50_000).optional(),
  key_risks: z.string().max(50_000).optional(),
  next_actions: z.string().max(50_000).optional(),
  recommendations: z.string().max(50_000).optional(),
  customer_highlights: z.string().max(50_000).optional(),
  operational_health_summary: z.string().max(50_000).optional(),
  management_summary: z.string().max(50_000).optional(),
  customer_email: z.string().max(50_000).optional(),
  meeting_agenda: z.string().max(50_000).optional(),
});

const workspaceSchema = z.object({
  reportId: z.string().uuid().optional(),
  clientId: z.string().uuid(),
  reportTitle: z.string().max(500),
  reportingPeriodStart: z.string().max(32),
  reportingPeriodEnd: z.string().max(32),
  fieldValues: fieldValuesSchema.default({}),
  styleMode: reportAIStyleSchema.optional(),
});

const reportAssistantInputSchema = workspaceSchema.extend({
  action: reportAIActionSchema,
  section: reportAISectionSchema.nullable().optional(),
});

const entireReportInputSchema = workspaceSchema;

export type ReportAssistantActionInput = z.infer<typeof reportAssistantInputSchema>;
export type EntireReportActionInput = z.infer<typeof entireReportInputSchema>;

type SuccessMeta = {
  providerId: string;
  model: string;
  isPlaceholder: boolean;
  usageSummary: AIUsageSummary;
  devNotice?: string;
  tokenUsage?: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
  };
  confidence: AIConfidenceScore;
  warnings: AIWarning[];
  suggestions: AISmartSuggestion[];
  contextSnapshot: ReportAIContextSnapshot;
  durationMs: number;
};

export type ReportAssistantActionResult =
  | ({
      ok: true;
      content: string;
      section: ReportAISectionKey | null;
    } & SuccessMeta)
  | {
      ok: false;
      error: string;
      code?: string;
      retryable?: boolean;
    };

export type EntireReportActionResult =
  | ({
      ok: true;
      sections: EntireReportSectionResult[];
    } & SuccessMeta)
  | {
      ok: false;
      error: string;
      code?: string;
      retryable?: boolean;
    };

async function verifyClientInOrg(session: Awaited<ReturnType<typeof requireSession>>, clientId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select("id, name")
    .eq("organization_id", session.organization.id)
    .eq("id", clientId)
    .maybeSingle();

  if (error || !data) {
    throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
  }

  return data as { id: string; name: string };
}

async function assertReportAccess(
  session: Awaited<ReturnType<typeof requireSession>>,
  input: { reportId?: string; clientId: string },
) {
  if (input.reportId) {
    const report = await getReportById(session, input.reportId);

    if (!report || report.client_id !== input.clientId) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }

    if (!canEditReport(session, report)) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }
  } else if (!canCreateReport(session)) {
    throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
  }
}

async function assertBatchUsageCapacity(organizationId: string, planKey: Awaited<ReturnType<typeof getCurrentPlan>>, steps: number) {
  const limit = getAIUsageLimit(planKey);

  if (limit === 0) {
    throw new AIUserError(AI_PLAN_RESTRICTED_MESSAGE, "plan_restricted");
  }

  const used = await getOrganizationAIMonthlyUsageCount(organizationId);

  if (used + steps > limit) {
    throw new AIUserError(AI_RATE_LIMIT_MESSAGE, "rate_limit");
  }
}

function buildMeta(
  trustedContext: Awaited<ReturnType<typeof buildTrustedReportAIContext>>,
  workspace: {
    clientId: string;
    reportingPeriodStart: string;
    reportingPeriodEnd: string;
  },
): Pick<SuccessMeta, "confidence" | "warnings" | "suggestions" | "contextSnapshot"> {
  return {
    confidence: calculateConfidence(trustedContext),
    warnings: buildAIWarnings(trustedContext, workspace),
    suggestions: buildSmartSuggestions(trustedContext),
    contextSnapshot: buildContextSnapshot(trustedContext),
  };
}

function toActionError(error: unknown) {
  return toAIActionError(error);
}

async function generateSection(
  session: Awaited<ReturnType<typeof requireSession>>,
  planKey: Awaited<ReturnType<typeof getCurrentPlan>>,
  trustedContext: Awaited<ReturnType<typeof buildTrustedReportAIContext>>,
  action: ReportAIActionKey,
  section: ReportAISectionKey,
  fieldValues: z.infer<typeof fieldValuesSchema>,
  styleMode?: ReportAIStyleMode,
  contextBuildMs = 0,
) {
  const started = Date.now();
  await assertWithinAIUsageLimit(session.organization.id, planKey);

  const prompt = buildReportAIPrompt(action, trustedContext, section, fieldValues, styleMode);
  const { provider, devNotice } = resolveAIProvider();

  const providerStarted = Date.now();
  const response = await provider.generate({
    prompt,
    action,
    section,
    context: trustedContext,
    styleMode,
  });
  const providerLatencyMs = Date.now() - providerStarted;

  const validationStarted = Date.now();
  const validated = validateAIOutput(response.content);
  const validationMs = Date.now() - validationStarted;

  if (!validated.valid) {
    recordAIGenerationMetric({
      module: "report",
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
    provider: response.providerId,
    model: response.model,
    inputTokens,
    outputTokens,
    totalTokens,
  });

  recordAIGenerationMetric({
    module: "report",
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

  return {
    content: validated.content,
    providerId: response.providerId,
    model: response.model,
    isPlaceholder: response.isPlaceholder,
    devNotice: mergeDevNotices(
      devNotice,
      buildKnowledgeInfluenceNotice(trustedContext.knowledgeSnippets ?? []),
    ),
    tokenUsage: { inputTokens, outputTokens, totalTokens },
  };
}

/** Server-side AI generation for the report assistant. */
export async function runReportAssistantServerAction(
  input: ReportAssistantActionInput,
): Promise<ReportAssistantActionResult> {
  const started = Date.now();

  try {
    const session = await requireSession();

    if (!canAccessModule(session.role, "reports", "read")) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }

    await assertCanUseFeature(session.organization.id, "ai_report_assistant");

    const parsed = reportAssistantInputSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: "Invalid AI request. Please refresh and try again.",
        code: "validation",
        retryable: false,
      };
    }

    const client = await verifyClientInOrg(session, parsed.data.clientId);
    await assertReportAccess(session, parsed.data);

    const planKey = await getCurrentPlan(session.organization.id);

    const { result: trustedContext, ms: contextBuildMs } = await timeAIContextBuild(() =>
      buildTrustedReportAIContext(session, {
        reportId: parsed.data.reportId,
        clientId: client.id,
        clientName: client.name,
        reportTitle: parsed.data.reportTitle,
        reportingPeriodStart: parsed.data.reportingPeriodStart,
        reportingPeriodEnd: parsed.data.reportingPeriodEnd,
        fieldValues: parsed.data.fieldValues,
      }),
    );

    const normalizedAction = normalizeAction(parsed.data.action as ReportAIActionKey);
    const section =
      (parsed.data.section as ReportAISectionKey | null | undefined) ??
      inferTargetSection(normalizedAction) ??
      null;

    if (!section) {
      return {
        ok: false,
        error: "Select a target section for this action.",
        code: "validation",
        retryable: false,
      };
    }

    const generated = await generateSection(
      session,
      planKey,
      trustedContext,
      normalizedAction,
      section,
      parsed.data.fieldValues,
      parsed.data.styleMode as ReportAIStyleMode | undefined,
      contextBuildMs,
    );

    await recordActivityEvent({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      entityType: "report",
      entityId: parsed.data.reportId ?? null,
      action: "ai_report_assistant_used",
      title: `AI assistant: ${REPORT_AI_ACTION_LABELS[normalizedAction]}`,
      metadata: {
        action: normalizedAction,
        section,
        provider: generated.providerId,
        model: generated.model,
        reportId: parsed.data.reportId ?? null,
        clientId: parsed.data.clientId,
      },
    });

    const usageSummary = await getAIUsageSummaryForPlan(session.organization.id, planKey);
    const durationMs = Date.now() - started;

    return {
      ok: true,
      content: generated.content,
      section,
      providerId: generated.providerId,
      model: generated.model,
      isPlaceholder: generated.isPlaceholder,
      usageSummary,
      devNotice: generated.devNotice ?? undefined,
      tokenUsage: generated.tokenUsage,
      durationMs,
      ...buildMeta(trustedContext, {
        clientId: parsed.data.clientId,
        reportingPeriodStart: parsed.data.reportingPeriodStart,
        reportingPeriodEnd: parsed.data.reportingPeriodEnd,
      }),
    };
  } catch (error) {
    return toActionError(error);
  }
}

/** Sequentially generate all sections for Entire Report mode. */
export async function runEntireReportServerAction(
  input: EntireReportActionInput,
): Promise<EntireReportActionResult> {
  const started = Date.now();

  try {
    const session = await requireSession();

    if (!canAccessModule(session.role, "reports", "read")) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }

    await assertCanUseFeature(session.organization.id, "ai_report_assistant");

    const parsed = entireReportInputSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: "Invalid AI request. Please refresh and try again.",
        code: "validation",
        retryable: false,
      };
    }

    const planKey = await getCurrentPlan(session.organization.id);
    await assertBatchUsageCapacity(session.organization.id, planKey, ENTIRE_REPORT_SECTIONS.length);
    await assertReportAccess(session, parsed.data);

    const client = await verifyClientInOrg(session, parsed.data.clientId);
    const { result: trustedContext, ms: contextBuildMs } = await timeAIContextBuild(() =>
      buildTrustedReportAIContext(session, {
        reportId: parsed.data.reportId,
        clientId: client.id,
        clientName: client.name,
        reportTitle: parsed.data.reportTitle,
        reportingPeriodStart: parsed.data.reportingPeriodStart,
        reportingPeriodEnd: parsed.data.reportingPeriodEnd,
        fieldValues: parsed.data.fieldValues,
      }),
    );

    const sections: EntireReportSectionResult[] = [];
    let lastProvider = "placeholder";
    let lastModel = "placeholder";
    let isPlaceholder = true;
    let devNotice: string | undefined;
    const rollingFieldValues = { ...parsed.data.fieldValues };

    for (const section of ENTIRE_REPORT_SECTIONS) {
      try {
        const action = actionForSection(section);
        const generated = await generateSection(
          session,
          planKey,
          trustedContext,
          action,
          section,
          rollingFieldValues,
          parsed.data.styleMode as ReportAIStyleMode | undefined,
          contextBuildMs,
        );

        sections.push({ section, content: generated.content });
        rollingFieldValues[section] = generated.content;
        lastProvider = generated.providerId;
        lastModel = generated.model;
        isPlaceholder = generated.isPlaceholder;
        devNotice = generated.devNotice ?? devNotice;
      } catch (error) {
        sections.push({
          section,
          content: "",
          error: error instanceof AIUserError ? error.message : AI_GENERIC_ERROR_MESSAGE,
        });
      }
    }

    await recordActivityEvent({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      entityType: "report",
      entityId: parsed.data.reportId ?? null,
      action: "ai_report_assistant_used",
      title: "AI assistant: Generate entire report",
      metadata: {
        action: "generate_entire_report",
        sections: ENTIRE_REPORT_SECTIONS,
        provider: lastProvider,
        model: lastModel,
        reportId: parsed.data.reportId ?? null,
        clientId: parsed.data.clientId,
      },
    });

    const usageSummary = await getAIUsageSummaryForPlan(session.organization.id, planKey);
    const durationMs = Date.now() - started;

    return {
      ok: true,
      sections,
      providerId: lastProvider,
      model: lastModel,
      isPlaceholder,
      usageSummary,
      devNotice,
      durationMs,
      ...buildMeta(trustedContext, {
        clientId: parsed.data.clientId,
        reportingPeriodStart: parsed.data.reportingPeriodStart,
        reportingPeriodEnd: parsed.data.reportingPeriodEnd,
      }),
    };
  } catch (error) {
    return toActionError(error);
  }
}
