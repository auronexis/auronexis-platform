import "server-only";

import { resolveAIProvider } from "@/lib/ai/server/resolve-provider";
import { assertWithinAIUsageLimit } from "@/lib/ai/usage/queries";
import { recordAIUsageEvent } from "@/lib/ai/usage/record";
import type { ReportAIContext } from "@/lib/ai/types";
import { buildDeterministicNarrativeResult } from "@/lib/executive-intelligence/fallback";
import { EXECUTIVE_INTELLIGENCE_SYSTEM_PROMPT, buildNarrativeUserPrompt } from "@/lib/executive-intelligence/prompts";
import { checkExecutiveIntelligenceRateLimit } from "@/lib/executive-intelligence/rate-limit";
import { redactObjectForPrompt } from "@/lib/executive-intelligence/redaction";
import { evidenceKey } from "@/lib/executive-intelligence/evidence";
import { extractJsonPayload, validateNarrativeOutput } from "@/lib/executive-intelligence/schemas";
import type {
  ExecutiveBriefing,
  ExecutiveIntelligenceSnapshot,
  GroundedNarrativeResult,
} from "@/lib/executive-intelligence/types";
import type { SessionContext } from "@/lib/tenancy/context";
import type { PlanKey } from "@/lib/billing/plans";

function buildMinimalReportContext(session: SessionContext): ReportAIContext {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).toISOString();
  return {
    reportTitle: "Executive Intelligence",
    clientId: "00000000-0000-0000-0000-000000000000",
    clientName: "Organization",
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

export async function generateGroundedExecutiveNarrative(input: {
  session: SessionContext;
  snapshot: ExecutiveIntelligenceSnapshot;
  briefing: ExecutiveBriefing;
  planKey: PlanKey;
  aiAllowed: boolean;
}): Promise<GroundedNarrativeResult> {
  const fallback = buildDeterministicNarrativeResult(input.snapshot, input.briefing);

  if (!input.aiAllowed) {
    return fallback;
  }

  const rate = checkExecutiveIntelligenceRateLimit(
    input.session.organization.id,
    input.session.user.id,
  );
  if (!rate.allowed) {
    return fallback;
  }

  try {
    await assertWithinAIUsageLimit(input.session.organization.id, input.planKey);
  } catch {
    return fallback;
  }

  const { provider } = resolveAIProvider();
  if (provider.id === "placeholder") {
    return fallback;
  }

  const evidenceKeys = new Set<string>();
  for (const finding of input.snapshot.topFindings) {
    for (const ev of finding.evidence) {
      evidenceKeys.add(evidenceKey(ev));
    }
  }

  const payload = redactObjectForPrompt({
    period: input.snapshot.period.label,
    summary: input.briefing.summary,
    concerns: input.briefing.concerns.map((f) => ({
      title: f.title,
      summary: f.summary,
      severity: f.severity,
      evidenceKeys: f.evidence.map(evidenceKey),
    })),
    wins: input.briefing.keyWins.map((f) => f.title),
    priorityCount: input.snapshot.priorityClients.length,
    evidenceKeys: [...evidenceKeys],
  });

  try {
    const response = await provider.generate({
      prompt: `${EXECUTIVE_INTELLIGENCE_SYSTEM_PROMPT}\n\n${buildNarrativeUserPrompt(payload)}`,
      action: "generate_summary",
      section: "executive_summary",
      context: buildMinimalReportContext(input.session),
      temperature: 0.2,
      maxTokens: 1200,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJsonPayload(response.content));
    } catch {
      return fallback;
    }

    const validated = validateNarrativeOutput(parsed, evidenceKeys);
    if (!validated) {
      return fallback;
    }

    await recordAIUsageEvent({
      organizationId: input.session.organization.id,
      userId: input.session.user.id,
      feature: "executive_intelligence",
      provider: response.providerId,
      model: response.model,
      inputTokens: response.usage?.promptTokens,
      outputTokens: response.usage?.completionTokens,
    }).catch(() => undefined);

    return {
      narrative: validated.narrative,
      generatedBy: "ai_assisted",
      provider: response.providerId,
      model: response.model,
    };
  } catch (error) {
    console.warn("[executive-intelligence] AI narrative failed:", {
      operation: "generateGroundedExecutiveNarrative",
      organization_id: input.session.organization.id,
      message: error instanceof Error ? error.message : "unknown",
    });
    return fallback;
  }
}
