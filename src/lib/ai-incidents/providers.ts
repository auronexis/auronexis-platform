import "server-only";

import {
  resolveDomainAIProvider,
  type ResolvedDomainAIProvider,
} from "@/lib/ai/server/resolve-domain-provider";
import type { IncidentAIProviderName } from "@/lib/ai-incidents/types";

export type ResolvedIncidentAIProvider = Omit<ResolvedDomainAIProvider, "providerName"> & {
  providerName: IncidentAIProviderName;
};

/** Resolve incident AI provider from existing AI settings. */
export function resolveIncidentAIProvider(): ResolvedIncidentAIProvider {
  return resolveDomainAIProvider({
    mockModel: "mock-incident-v1",
    disabledNotice: "AI incident assistant is disabled.",
  }) as ResolvedIncidentAIProvider;
}

export function mapProviderIdToDisplayName(providerId: string): IncidentAIProviderName {
  if (providerId === "openai") return "OpenAI";
  if (providerId === "anthropic") return "Anthropic";
  if (providerId === "disabled") return "Disabled";
  return "Mock";
}
