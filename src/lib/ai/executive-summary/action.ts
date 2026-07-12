"use server";

import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import { buildTrustedReportAIContext } from "@/lib/ai/context-builder";
import {
  AI_ACCESS_DENIED_MESSAGE,
  AI_GENERIC_ERROR_MESSAGE,
  AIUserError,
} from "@/lib/ai/errors";
import {
  buildExecutiveSummaryPromptInput,
} from "@/lib/ai/executive-summary/input";
import { executiveSummaryJsonSchema } from "@/lib/ai/executive-summary/json-schema";
import {
  EXECUTIVE_SUMMARY_SYSTEM_PROMPT,
  buildExecutiveSummaryUserPrompt,
} from "@/lib/ai/executive-summary/prompts";
import {
  EXECUTIVE_SUMMARY_PROMPT_VERSION,
  extractJsonPayload,
  formatExecutiveSummaryDraft,
  validateExecutiveSummaryOutput,
  type ExecutiveSummaryOutput,
} from "@/lib/ai/executive-summary/schema";
import {
  checkOpenAIGenerationLimits,
  getOpenAIPlatformConfig,
  hasActiveReportGeneration,
  recordOpenAIRequestLog,
  runOpenAIStructuredResponse,
} from "@/lib/ai/openai";
import { assertWithinAIUsageLimit } from "@/lib/ai/usage/queries";
import { requireSession } from "@/lib/auth/session";
import { getStoredOrganizationLanguage } from "@/lib/i18n/resolve-locale";
import { assertCanUseFeature } from "@/lib/plans/guards";
import { getCurrentPlan } from "@/lib/plans/queries";
import { canEditReport } from "@/lib/reports/guards";
import { getReportById } from "@/lib/reports/queries";
import { canAccessModule } from "@/lib/rbac/permissions";
import { createClient } from "@/lib/supabase/server";

const FEATURE = "executive_report_summary";

const inputSchema = z.object({
  reportId: z.string().uuid(),
  clientId: z.string().uuid(),
  reportTitle: z.string().min(1).max(200),
  reportingPeriodStart: z.string().min(1),
  reportingPeriodEnd: z.string().min(1),
  fieldValues: z
    .object({
      executive_summary: z.string().max(50_000).optional(),
      key_wins: z.string().max(50_000).optional(),
      key_risks: z.string().max(50_000).optional(),
      next_actions: z.string().max(50_000).optional(),
    })
    .optional(),
});

export type GenerateExecutiveSummaryResult =
  | {
      ok: true;
      draft: ExecutiveSummaryOutput;
      formattedDraft: string;
      model: string;
      promptVersion: string;
      hasExistingSummary: boolean;
    }
  | {
      ok: false;
      error: string;
      code:
        | "access_denied"
        | "plan_restricted"
        | "validation"
        | "disabled"
        | "not_configured"
        | "rate_limit"
        | "provider_error"
        | "malformed_output"
        | "duplicate";
      retryable: boolean;
      retryAfterSeconds?: number;
    };

function mapContextToPromptInput(
  trustedContext: Awaited<ReturnType<typeof buildTrustedReportAIContext>>,
  organizationLanguage: ReturnType<typeof getStoredOrganizationLanguage>,
) {
  const metrics: string[] = [];
  if (trustedContext.metrics) {
    metrics.push(`Open risks: ${trustedContext.metrics.openRisksCount}`);
    metrics.push(`Critical risks: ${trustedContext.metrics.criticalRisksCount}`);
    metrics.push(`Open incidents: ${trustedContext.metrics.openIncidentsCount}`);
    metrics.push(`Critical incidents: ${trustedContext.metrics.criticalIncidentsCount}`);
  }
  if (trustedContext.slaBreachesCount != null) {
    metrics.push(`SLA breaches: ${trustedContext.slaBreachesCount}`);
  }
  if (trustedContext.completedReportsCount != null) {
    metrics.push(`Completed reports: ${trustedContext.completedReportsCount}`);
  }

  const trends: string[] = [];
  if (trustedContext.operationalHealthSummary?.trim()) {
    trends.push(trustedContext.operationalHealthSummary.trim().slice(0, 180));
  }
  if (trustedContext.managementSummary?.trim()) {
    trends.push(trustedContext.managementSummary.trim().slice(0, 180));
  }

  return buildExecutiveSummaryPromptInput({
    clientName: trustedContext.clientName,
    reportTitle: trustedContext.reportTitle,
    periodLabel: trustedContext.periodLabel,
    organizationLanguage,
    healthScore: trustedContext.profitability?.margin ?? null,
    healthStatus: trustedContext.customerHealth ?? trustedContext.profitability?.health ?? null,
    slaScore: null,
    slaStatus:
      trustedContext.slaBreachesCount != null && trustedContext.slaBreachesCount > 0
        ? `${trustedContext.slaBreachesCount} breach(es)`
        : trustedContext.slaBreachesCount === 0
          ? "No breaches recorded"
          : null,
    openRisks: trustedContext.openRisks.map((risk) => ({
      title: risk.title,
      severity: risk.severity,
    })),
    openIncidents: trustedContext.openIncidents.map((incident) => ({
      title: incident.title,
      severity: incident.severity,
    })),
    trends,
    metrics,
    existingExecutiveSummary: trustedContext.executiveSummary,
    activity: (trustedContext.recentActivity ?? []).map((item) => ({
      title: item.title,
      action: item.action,
    })),
  });
}

/** Generate a structured executive summary draft — never auto-saves or publishes. */
export async function generateExecutiveSummaryAction(
  input: z.infer<typeof inputSchema>,
): Promise<GenerateExecutiveSummaryResult> {
  try {
    const session = await requireSession();

    if (!canAccessModule(session.role, "reports", "read")) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }

    await assertCanUseFeature(session.organization.id, "ai_report_assistant");

    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Invalid request. Please refresh and try again.",
        code: "validation",
        retryable: false,
      };
    }

    const platformConfig = getOpenAIPlatformConfig();
    if (!platformConfig.enabled) {
      return {
        ok: false,
        error: "AI is disabled.",
        code: "disabled",
        retryable: false,
      };
    }
    if (platformConfig.state === "not_configured") {
      return {
        ok: false,
        error: "OpenAI is not configured.",
        code: "not_configured",
        retryable: false,
      };
    }

    const supabase = await createClient();
    const { data: clientRow, error: clientError } = await supabase
      .from("clients")
      .select("id, name")
      .eq("organization_id", session.organization.id)
      .eq("id", parsed.data.clientId)
      .maybeSingle();

    if (clientError || !clientRow) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }

    const report = await getReportById(session, parsed.data.reportId);
    if (!report || report.client_id !== parsed.data.clientId) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }

    if (!canEditReport(session, report)) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }

    if (report.status !== "draft") {
      return {
        ok: false,
        error: "Executive summaries can only be generated for draft reports.",
        code: "validation",
        retryable: false,
      };
    }

    const planKey = await getCurrentPlan(session.organization.id);
    await assertWithinAIUsageLimit(session.organization.id, planKey);

    const rateLimit = await checkOpenAIGenerationLimits({
      organizationId: session.organization.id,
      userId: session.user.id,
      feature: FEATURE,
      reportId: parsed.data.reportId,
    });

    if (!rateLimit.allowed) {
      await recordActivityEvent({
        organizationId: session.organization.id,
        actorUserId: session.user.id,
        entityType: "report",
        entityId: parsed.data.reportId,
        action: "ai_rate_limit_reached",
        title: "AI rate limit reached",
        metadata: { feature: FEATURE, reason: rateLimit.reason ?? "unknown" },
      });
      return {
        ok: false,
        error: "Please wait before generating another summary.",
        code: "rate_limit",
        retryable: true,
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      };
    }

    if (await hasActiveReportGeneration(parsed.data.reportId)) {
      return {
        ok: false,
        error: "A summary generation is already in progress for this report.",
        code: "duplicate",
        retryable: true,
        retryAfterSeconds: 30,
      };
    }

    await recordOpenAIRequestLog({
      organizationId: session.organization.id,
      userId: session.user.id,
      clientId: parsed.data.clientId,
      reportId: parsed.data.reportId,
      model: platformConfig.model,
      feature: FEATURE,
      status: "failed",
      promptVersion: EXECUTIVE_SUMMARY_PROMPT_VERSION,
      errorCode: "in_progress",
    });

    const client = clientRow as { id: string; name: string };

    const trustedContext = await buildTrustedReportAIContext(session, {
      reportId: parsed.data.reportId,
      clientId: client.id,
      clientName: client.name,
      reportTitle: parsed.data.reportTitle,
      reportingPeriodStart: parsed.data.reportingPeriodStart,
      reportingPeriodEnd: parsed.data.reportingPeriodEnd,
      fieldValues: parsed.data.fieldValues ?? {},
    });

    const organizationLanguage = getStoredOrganizationLanguage(session.organization);
    const promptInput = mapContextToPromptInput(trustedContext, organizationLanguage);
    const userPrompt = buildExecutiveSummaryUserPrompt(promptInput);

    if (userPrompt.length > 12_000) {
      return {
        ok: false,
        error: "Report context is too large for AI generation.",
        code: "validation",
        retryable: false,
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), platformConfig.timeoutMs);

    const response = await runOpenAIStructuredResponse({
      instructions: EXECUTIVE_SUMMARY_SYSTEM_PROMPT,
      userInput: userPrompt,
      schemaName: "executive_summary",
      schema: executiveSummaryJsonSchema,
      maxOutputTokens: platformConfig.maxOutputTokens,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      await recordOpenAIRequestLog({
        organizationId: session.organization.id,
        userId: session.user.id,
        clientId: parsed.data.clientId,
        reportId: parsed.data.reportId,
        model: platformConfig.model,
        feature: FEATURE,
        status: "failed",
        promptVersion: EXECUTIVE_SUMMARY_PROMPT_VERSION,
        latencyMs: response.latencyMs,
        providerRequestId: response.providerRequestId,
        errorCode: response.errorCode,
      });

      await recordActivityEvent({
        organizationId: session.organization.id,
        actorUserId: session.user.id,
        entityType: "report",
        entityId: parsed.data.reportId,
        action: "ai_summary_generation_failed",
        title: "Executive summary generation failed",
        metadata: { feature: FEATURE, error_code: response.errorCode },
      });

      return {
        ok: false,
        error: response.sanitizedMessage,
        code:
          response.errorCode === "malformed_output"
            ? "malformed_output"
            : "provider_error",
        retryable: response.errorCode === "rate_limited" || response.errorCode === "timeout",
      };
    }

    let parsedOutput: ExecutiveSummaryOutput | null = null;
    try {
      parsedOutput = validateExecutiveSummaryOutput(
        JSON.parse(extractJsonPayload(response.outputText)),
      );
    } catch {
      parsedOutput = null;
    }

    if (!parsedOutput) {
      await recordOpenAIRequestLog({
        organizationId: session.organization.id,
        userId: session.user.id,
        clientId: parsed.data.clientId,
        reportId: parsed.data.reportId,
        model: response.model,
        feature: FEATURE,
        status: "failed",
        promptVersion: EXECUTIVE_SUMMARY_PROMPT_VERSION,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        totalTokens: response.totalTokens,
        latencyMs: response.latencyMs,
        providerRequestId: response.providerRequestId,
        errorCode: "malformed_output",
      });

      return {
        ok: false,
        error: "AI returned an invalid summary. Please try again.",
        code: "malformed_output",
        retryable: true,
      };
    }

    await recordOpenAIRequestLog({
      organizationId: session.organization.id,
      userId: session.user.id,
      clientId: parsed.data.clientId,
      reportId: parsed.data.reportId,
      model: response.model,
      feature: FEATURE,
      status: "succeeded",
      promptVersion: EXECUTIVE_SUMMARY_PROMPT_VERSION,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      totalTokens: response.totalTokens,
      latencyMs: response.latencyMs,
      providerRequestId: response.providerRequestId,
    });

    await recordActivityEvent({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      entityType: "report",
      entityId: parsed.data.reportId,
      action: "ai_summary_generation_succeeded",
      title: "Executive summary generated",
      metadata: { feature: FEATURE, prompt_version: EXECUTIVE_SUMMARY_PROMPT_VERSION },
    });

    const hasExistingSummary = Boolean(trustedContext.executiveSummary?.trim());

    return {
      ok: true,
      draft: parsedOutput,
      formattedDraft: formatExecutiveSummaryDraft(parsedOutput),
      model: response.model,
      promptVersion: EXECUTIVE_SUMMARY_PROMPT_VERSION,
      hasExistingSummary,
    };
  } catch (error) {
    if (error instanceof AIUserError) {
      return {
        ok: false,
        error: error.message,
        code:
          error.code === "plan_restricted"
            ? "plan_restricted"
            : error.code === "rate_limit"
              ? "rate_limit"
              : "access_denied",
        retryable: error.retryable,
      };
    }

    return {
      ok: false,
      error: AI_GENERIC_ERROR_MESSAGE,
      code: "provider_error",
      retryable: true,
    };
  }
}
