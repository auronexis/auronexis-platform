import "server-only";

import {
  resolveDomainAIProvider,
  type ResolvedDomainAIProvider,
} from "@/lib/ai/server/resolve-domain-provider";
import type { RiskAIProviderName } from "@/lib/ai-risks/types";

export type ResolvedRiskAIProvider = Omit<ResolvedDomainAIProvider, "providerName"> & {
  providerName: RiskAIProviderName;
};

/** Resolve risk AI provider from existing AI settings. */
export function resolveRiskAIProvider(): ResolvedRiskAIProvider {
  return resolveDomainAIProvider({
    mockModel: "mock-risk-v1",
    disabledNotice: "AI risk assistant is disabled.",
  }) as ResolvedRiskAIProvider;
}
