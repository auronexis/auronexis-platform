"use server";

import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import { toAIActionError } from "@/lib/ai/core";
import {
  AI_ACCESS_DENIED_MESSAGE,
  AIUserError,
} from "@/lib/ai/errors";
import { getKnowledgeHubData } from "@/lib/ai/knowledge/get-hub";
import { formatKnowledgeBlock } from "@/lib/ai/knowledge/prompts";
import { searchOrganizationalKnowledge } from "@/lib/ai/knowledge/search";
import type { KnowledgeAnswer, KnowledgeArticle, KnowledgePlaybook } from "@/lib/ai/knowledge/types";
import { resolveAIProvider } from "@/lib/ai/server/resolve-provider";
import { assertWithinAIUsageLimit, getAIUsageSummaryForPlan } from "@/lib/ai/usage/queries";
import { recordAIUsageEvent } from "@/lib/ai/usage/record";
import { requireSession } from "@/lib/auth/session";
import { assertCanUseFeature } from "@/lib/plans/guards";
import { getCurrentPlan } from "@/lib/plans/queries";
import { canAccessModule } from "@/lib/rbac/permissions";

const searchSchema = z.object({
  query: z.string().min(1).max(500),
  clientId: z.string().uuid().optional(),
});

const questionSchema = z.object({
  question: z.string().min(4).max(2000),
  clientId: z.string().uuid().optional(),
});

const generateSchema = z.object({
  sourceType: z.enum(["report", "risk", "incident", "playbook"]),
  sourceId: z.string().optional(),
  clientId: z.string().uuid().optional(),
});

function toError(error: unknown) {
  return toAIActionError(error);
}

export async function searchKnowledgeServerAction(input: z.infer<typeof searchSchema>) {
  try {
    const session = await requireSession();
    if (!canAccessModule(session.role, "knowledge", "read")) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }
    await assertCanUseFeature(session.organization.id, "ai_knowledge_search");

    const parsed = searchSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false as const, error: "Enter a search query.", retryable: false };
    }

    const result = await searchOrganizationalKnowledge(
      session,
      parsed.data.query,
      parsed.data.clientId ? { clientId: parsed.data.clientId } : undefined,
    );

    await recordAIUsageEvent({
      organizationId: session.organization.id,
      userId: session.user.id,
      feature: "ai_knowledge_search",
      provider: "keyword",
      model: "local",
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
    });

    return { ok: true as const, result };
  } catch (error) {
    return toError(error);
  }
}

export async function answerKnowledgeQuestionServerAction(input: z.infer<typeof questionSchema>) {
  try {
    const session = await requireSession();
    if (!canAccessModule(session.role, "knowledge", "read")) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }
    await assertCanUseFeature(session.organization.id, "ai_knowledge_search");

    const parsed = questionSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false as const, error: "Ask a complete question.", retryable: false };
    }

    const planKey = await getCurrentPlan(session.organization.id);
    await assertWithinAIUsageLimit(session.organization.id, planKey);

    const search = await searchOrganizationalKnowledge(
      session,
      parsed.data.question,
      parsed.data.clientId ? { clientId: parsed.data.clientId } : undefined,
      8,
    );

    if (search.snippets.length === 0) {
      const answer: KnowledgeAnswer = {
        summary: "No verified historical knowledge matches this question in your organization.",
        confidence: 15,
        citations: [],
        insufficientData: true,
      };
      return { ok: true as const, answer };
    }

    const prompt = [
      "Answer the user's question using ONLY the verified organizational memory below.",
      "Never invent facts. Always cite source entities.",
      "If insufficient data, say so clearly.",
      "",
      `Question: ${parsed.data.question}`,
      "",
      formatKnowledgeBlock(search.snippets),
    ].join("\n");

    const { provider } = resolveAIProvider();
    const response = await provider.generate({
      prompt,
      action: "knowledge_answer" as never,
      context: { organizationId: session.organization.id } as never,
    });

    await recordAIUsageEvent({
      organizationId: session.organization.id,
      userId: session.user.id,
      feature: "ai_knowledge_search",
      provider: response.providerId,
      model: response.model,
      inputTokens: response.usage?.promptTokens ?? null,
      outputTokens: response.usage?.completionTokens ?? null,
      totalTokens:
        response.usage?.promptTokens != null && response.usage?.completionTokens != null
          ? response.usage.promptTokens + response.usage.completionTokens
          : null,
    });

    const answer: KnowledgeAnswer = {
      summary: response.content,
      confidence: Math.min(95, 40 + search.snippets.length * 8),
      citations: search.snippets,
      referencedReport: search.snippets.find((s) => s.sourceType === "report") ?? null,
      referencedIncident: search.snippets.find((s) => s.sourceType === "incident") ?? null,
      referencedRisk: search.snippets.find((s) => s.sourceType === "risk") ?? null,
      insufficientData: false,
    };

    return { ok: true as const, answer, usageSummary: await getAIUsageSummaryForPlan(session.organization.id, planKey) };
  } catch (error) {
    return toError(error);
  }
}

export async function generateKnowledgeArticleServerAction(input: z.infer<typeof generateSchema>) {
  try {
    const session = await requireSession();
    if (!canAccessModule(session.role, "knowledge", "create")) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }
    await assertCanUseFeature(session.organization.id, "ai_knowledge_generation");

    const parsed = generateSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false as const, error: "Invalid generation request.", retryable: false };
    }

    const hub = await getKnowledgeHubData(session);
    const existing = hub.articles.find((article) => article.sourceId === parsed.data.sourceId);
    if (existing) {
      return { ok: true as const, article: existing };
    }

    const planKey = await getCurrentPlan(session.organization.id);
    await assertWithinAIUsageLimit(session.organization.id, planKey);

    const source =
      hub.resolvedIncidents.find((item) => item.entityId === parsed.data.sourceId) ??
      hub.resolvedRisks.find((item) => item.entityId === parsed.data.sourceId) ??
      hub.publishedReports.find((item) => item.entityId === parsed.data.sourceId);

    if (!source) {
      return { ok: false as const, error: "Source entity not found in verified knowledge.", retryable: false };
    }

    const prompt = [
      "Generate a knowledge article from the verified source below.",
      "Structure: Title, Summary, Problem, Resolution, Lessons Learned, Recommendations.",
      "Never invent facts beyond the source excerpt.",
      "",
      `Source title: ${source.title}`,
      `Source excerpt: ${source.excerpt}`,
    ].join("\n");

    const { provider } = resolveAIProvider();
    const response = await provider.generate({
      prompt,
      action: "knowledge_article" as never,
      context: source as never,
    });

    await recordAIUsageEvent({
      organizationId: session.organization.id,
      userId: session.user.id,
      feature: "ai_knowledge_generation",
      provider: response.providerId,
      model: response.model,
      inputTokens: response.usage?.promptTokens ?? null,
      outputTokens: response.usage?.completionTokens ?? null,
      totalTokens: null,
    });

    const article: KnowledgeArticle = {
      id: `generated-${source.entityId}`,
      title: `Knowledge: ${source.title}`,
      summary: source.excerpt,
      problem: source.excerpt,
      resolution: response.content.slice(0, 500),
      lessonsLearned: "Generated from verified organizational source.",
      recommendations: response.content,
      relatedEntities: [source],
      generatedFrom: source.entityType,
      sourceId: source.entityId,
      sourceHref: source.href,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confidence: 80,
      clientId: source.clientId,
      clientName: source.clientName,
    };

    await recordActivityEvent({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      entityType: "organization",
      entityId: session.organization.id,
      action: "ai_knowledge_article_generated",
      title: article.title,
      metadata: { sourceId: source.entityId, sourceType: source.entityType },
    });

    return { ok: true as const, article };
  } catch (error) {
    return toError(error);
  }
}

export async function generatePlaybookServerAction(input: { title: string; clientId?: string }) {
  try {
    const session = await requireSession();
    if (!canAccessModule(session.role, "knowledge", "create")) {
      throw new AIUserError(AI_ACCESS_DENIED_MESSAGE, "access_denied");
    }
    await assertCanUseFeature(session.organization.id, "ai_playbook_generation");

    const hub = await getKnowledgeHubData(session);
    const existing = hub.playbooks.find(
      (playbook) => playbook.title.toLowerCase() === input.title.toLowerCase(),
    );
    if (existing) {
      return { ok: true as const, playbook: existing };
    }

    const planKey = await getCurrentPlan(session.organization.id);
    await assertWithinAIUsageLimit(session.organization.id, planKey);

    const related = [
      ...hub.resolvedIncidents,
      ...hub.resolvedRisks,
      ...hub.publishedReports,
    ].slice(0, 5);

    const prompt = [
      "Generate an operational playbook from verified historical records.",
      "Return numbered steps only. Never invent incidents that are not listed.",
      "",
      `Playbook title: ${input.title}`,
      "",
      "Historical records:",
      ...related.map((item) => `- ${item.title}: ${item.excerpt}`),
    ].join("\n");

    const { provider } = resolveAIProvider();
    const response = await provider.generate({
      prompt,
      action: "knowledge_playbook" as never,
      context: { title: input.title } as never,
    });

    await recordAIUsageEvent({
      organizationId: session.organization.id,
      userId: session.user.id,
      feature: "ai_playbook_generation",
      provider: response.providerId,
      model: response.model,
      inputTokens: response.usage?.promptTokens ?? null,
      outputTokens: response.usage?.completionTokens ?? null,
      totalTokens: null,
    });

    const steps = response.content
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 8);

    const playbook: KnowledgePlaybook = {
      id: `playbook-${input.title.toLowerCase().replace(/\s+/g, "-")}`,
      title: input.title,
      summary: `Generated from ${related.length} verified historical records.`,
      steps: steps.length > 0 ? steps : ["Review historical records in Knowledge Hub.", "Assign owner.", "Document resolution."],
      relatedEntities: related.slice(0, 3),
      generatedFrom: "history",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confidence: Math.min(90, 50 + related.length * 8),
    };

    return { ok: true as const, playbook };
  } catch (error) {
    return toError(error);
  }
}
