import type { AIProvider, AIProviderFactory } from "@/lib/ai/providers/types";
import { placeholderAIProvider } from "@/lib/ai/providers/placeholder";
import type { AIProviderId } from "@/lib/ai/types";

const PROVIDER_FACTORIES: Partial<Record<AIProviderId, AIProviderFactory>> = {
  placeholder: () => placeholderAIProvider,
};

/** Resolve the active AI provider — defaults to placeholder until configured. */
export function getAIProvider(providerId: AIProviderId = "placeholder"): AIProvider {
  const factory = PROVIDER_FACTORIES[providerId];

  if (!factory) {
    throw new Error(`AI provider "${providerId}" is not registered yet.`);
  }

  return factory();
}

export function getDefaultAIProvider(): AIProvider {
  return getAIProvider("placeholder");
}

export { placeholderAIProvider };
