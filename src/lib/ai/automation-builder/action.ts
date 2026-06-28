"use server";

import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import {
  buildWorkflowTranslationPrompt,
  parseWorkflowFromAIResponse,
  translateWorkflowFallback,
} from "@/lib/ai/automation-builder/translator";
import { toAIActionError } from "@/lib/ai/core";
import {
  AI_ACCESS_DENIED_MESSAGE,
  AIUserError,
} from "@/lib/ai/errors";
import { resolveAIProvider } from "@/lib/ai/server/resolve-provider";
import { assertWithinAIUsageLimit, getAIUsageSummaryForPlan } from "@/lib/ai/usage/queries";
import { recordAIUsageEvent } from "@/lib/ai/usage/record";
import { parseWorkflowDefinition } from "@/lib/automation/builder/schema";
import { simulateWorkflow } from "@/lib/automation/builder/simulation";
import { validateWorkflow } from "@/lib/automation/builder/validation";
import type {
  WorkflowDefinition,
  WorkflowSimulationResult,
  WorkflowValidationResult,
} from "@/lib/automation/builder/types";
import type { AIUsageSummary } from "@/lib/ai/types";
import { requireSession } from "@/lib/auth/session";
import { assertCanUseFeature } from "@/lib/plans/guards";
import { getCurrentPlan } from "@/lib/plans/queries";
import { canAccessModule } from "@/lib/rbac/permissions";

const translateInputSchema = z.object({
  naturalLanguage: z.string().min(8).max(5000),
});

const workflowInputSchema = z.object({
  workflow: z.unknown(),
});

export type TranslateWorkflowResult =
  | {
      ok: true;
      workflow: WorkflowDefinition;
      validation: WorkflowValidationResult;
      providerId: string;
      model: string;
      isPlaceholder: boolean;
      usageSummary: AIUsageSummary;
      devNotice?: string;
      durationMs: number;
    }
  | { ok: false; error: string; code?: string; retryable?: boolean };

export type ValidateWorkflowResult =
  | { ok: true; validation: WorkflowValidationResult }
  | { ok: false; error: string };

export type SimulateWorkflowResult =
  | { ok: true; simulation: WorkflowSimulationResult; validation: WorkflowValidationResult }
  | { ok: false; error: string };

function toActionError(error: unknown) {
  return toAIActionError(error);
}

export async function translateWorkflowServerAction(
  input: z.infer<typeof translateInputSchema>,
): Promise<TranslateWorkflowResult> {
  const started = Date.now();

  try {
    const session = await requireSession();
    if (!canAccessModule(session.role, "workflows", "read")) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }

    const parsed = translateInputSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Describe your automation in a complete sentence.", code: "validation", retryable: false };
    }

    await assertCanUseFeature(session.organization.id, "ai_workflow_translation");
    const planKey = await getCurrentPlan(session.organization.id);
    await assertWithinAIUsageLimit(session.organization.id, planKey);

    const prompt = buildWorkflowTranslationPrompt(parsed.data.naturalLanguage);
    const { provider, devNotice } = resolveAIProvider();

    let workflow: WorkflowDefinition | null = null;
    let providerId = "fallback";
    let model = "rules";
    let isPlaceholder = true;

    try {
      const response = await provider.generate({
        prompt,
        action: "translate_workflow" as never,
        context: { organizationId: session.organization.id } as never,
      });

      providerId = response.providerId;
      model = response.model;
      isPlaceholder = response.isPlaceholder;
      workflow = parseWorkflowFromAIResponse(response.content);

      const inputTokens = response.usage?.promptTokens ?? null;
      const outputTokens = response.usage?.completionTokens ?? null;
      const totalTokens =
        inputTokens != null && outputTokens != null ? inputTokens + outputTokens : null;

      await recordAIUsageEvent({
        organizationId: session.organization.id,
        userId: session.user.id,
        feature: "ai_workflow_translation",
        provider: response.providerId,
        model: response.model,
        inputTokens,
        outputTokens,
        totalTokens,
      });
    } catch {
      workflow = translateWorkflowFallback(parsed.data.naturalLanguage);
    }

    if (!workflow) {
      workflow = translateWorkflowFallback(parsed.data.naturalLanguage);
    }

    const schemaResult = parseWorkflowDefinition(workflow);
    if (!schemaResult.success) {
      workflow = translateWorkflowFallback(parsed.data.naturalLanguage);
    }

    const validation = validateWorkflow(workflow);

    await recordActivityEvent({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      entityType: "organization",
      entityId: session.organization.id,
      action: "ai_workflow_translated",
      title: "AI workflow translation",
      metadata: { trigger: workflow.trigger.type, actionCount: workflow.actions.length },
    });

    const usageSummary = await getAIUsageSummaryForPlan(session.organization.id, planKey);

    return {
      ok: true,
      workflow,
      validation,
      providerId,
      model,
      isPlaceholder,
      usageSummary,
      devNotice: devNotice ?? undefined,
      durationMs: Date.now() - started,
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function validateWorkflowServerAction(
  input: z.infer<typeof workflowInputSchema>,
): Promise<ValidateWorkflowResult> {
  try {
    const session = await requireSession();
    if (!canAccessModule(session.role, "workflows", "read")) {
      return { ok: false, error: AI_ACCESS_DENIED_MESSAGE };
    }

    await assertCanUseFeature(session.organization.id, "ai_automation_builder");

    const parsed = workflowInputSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Invalid workflow payload." };
    }

    const schemaResult = parseWorkflowDefinition(parsed.data.workflow);
    if (!schemaResult.success) {
      return {
        ok: true,
        validation: {
          valid: false,
          issues: [{ id: "schema", severity: "error", message: "Workflow JSON failed schema validation." }],
        },
      };
    }

    return { ok: true, validation: validateWorkflow(schemaResult.data) };
  } catch (error) {
    return toActionError(error);
  }
}

export async function simulateWorkflowServerAction(
  input: z.infer<typeof workflowInputSchema>,
): Promise<SimulateWorkflowResult> {
  try {
    const session = await requireSession();
    if (!canAccessModule(session.role, "workflows", "read")) {
      return { ok: false, error: AI_ACCESS_DENIED_MESSAGE };
    }

    await assertCanUseFeature(session.organization.id, "ai_automation_builder");

    const parsed = workflowInputSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Invalid workflow payload." };
    }

    const schemaResult = parseWorkflowDefinition(parsed.data.workflow);
    if (!schemaResult.success) {
      return { ok: false, error: "Workflow JSON failed schema validation." };
    }

    const validation = validateWorkflow(schemaResult.data);
    const simulation = simulateWorkflow(schemaResult.data);

    await recordAIUsageEvent({
      organizationId: session.organization.id,
      userId: session.user.id,
      feature: "ai_automation_builder",
      provider: "simulation",
      model: "local",
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
    });

    return { ok: true, simulation, validation };
  } catch (error) {
    return toActionError(error);
  }
}
