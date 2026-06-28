import type { ConnectorDefinition } from "@/lib/connectors/types";

export type ConnectorModuleConfig = {
  id: ConnectorDefinition["id"];
  version?: string;
  name: string;
  description: string;
  category: ConnectorDefinition["category"];
  supportedActions: readonly string[];
  supportedTriggers: readonly string[];
  oauth: ConnectorDefinition["oauth"];
  webhooks?: boolean;
  health?: boolean;
  services?: readonly string[];
  authEnvPrefix: string;
  defaultScopes: readonly string[];
  authorizeUrl?: string;
  tokenUrl?: string;
  apiBaseUrl: string;
  resourceLabel: string;
};

export function buildConnectorDefinition(config: ConnectorModuleConfig): ConnectorDefinition {
  return {
    id: config.id,
    version: config.version ?? "1.0.0",
    name: config.name,
    description: config.description,
    category: config.category,
    supportedActions: config.supportedActions,
    supportedTriggers: config.supportedTriggers,
    oauth: config.oauth,
    webhooks: config.webhooks ?? true,
    health: config.health ?? true,
    services: config.services,
  };
}

export function buildOAuthEnvKeys(prefix: string): {
  clientId: string;
  clientSecret: string;
} {
  return {
    clientId: `${prefix}_CLIENT_ID`,
    clientSecret: `${prefix}_CLIENT_SECRET`,
  };
}

export function isOAuthConfigured(prefix: string): boolean {
  const keys = buildOAuthEnvKeys(prefix);
  return Boolean(process.env[keys.clientId] && process.env[keys.clientSecret]);
}
