import type { ConnectorDefinition, ConnectorId } from "@/lib/connectors/types";

const connectorRegistry = new Map<ConnectorId, ConnectorDefinition>();
let registryFrozen = false;
let cachedList: ConnectorDefinition[] | null = null;

export function registerConnector(definition: ConnectorDefinition): void {
  if (registryFrozen) {
    return;
  }

  connectorRegistry.set(definition.id, definition);
  cachedList = null;
}

export function getConnectorDefinition(id: ConnectorId): ConnectorDefinition | undefined {
  return connectorRegistry.get(id);
}

export function listConnectorDefinitions(): ConnectorDefinition[] {
  if (!cachedList) {
    cachedList = Array.from(connectorRegistry.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }
  return cachedList;
}

export function freezeConnectorRegistry(): void {
  if (registryFrozen) {
    return;
  }
  registryFrozen = true;
  cachedList = listConnectorDefinitions();
}

export function isConnectorRegistered(id: ConnectorId): boolean {
  return connectorRegistry.has(id);
}

export function getConnectorCount(): number {
  return connectorRegistry.size;
}
