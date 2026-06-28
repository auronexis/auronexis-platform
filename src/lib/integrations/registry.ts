import type { IntegrationProvider, IntegrationProviderId } from "@/lib/integrations/types";

const providerRegistry = new Map<IntegrationProviderId, IntegrationProvider>();
let registryFrozen = false;
let cachedProviderList: IntegrationProvider[] | null = null;

export function registerIntegrationProvider(provider: IntegrationProvider): void {
  if (registryFrozen) {
    return;
  }

  providerRegistry.set(provider.id, provider);
  cachedProviderList = null;
}

export function getIntegrationProvider(id: IntegrationProviderId): IntegrationProvider | undefined {
  return providerRegistry.get(id);
}

export function listIntegrationProviders(): IntegrationProvider[] {
  if (!cachedProviderList) {
    cachedProviderList = Array.from(providerRegistry.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  return cachedProviderList;
}

/** Locks registry after bootstrap — future plugins can register before freeze. */
export function freezeIntegrationRegistry(): void {
  if (registryFrozen) {
    return;
  }

  registryFrozen = true;
  cachedProviderList = listIntegrationProviders();
}

export function getIntegrationProviderCount(): number {
  return providerRegistry.size;
}

export function isIntegrationProviderRegistered(id: IntegrationProviderId): boolean {
  return providerRegistry.has(id);
}
