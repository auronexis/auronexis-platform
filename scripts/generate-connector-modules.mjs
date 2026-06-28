import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "src/lib/connectors");
const configs = [
  ["google", "GOOGLE_CONNECTOR_CONFIG"],
  ["microsoft", "MICROSOFT_CONNECTOR_CONFIG"],
  ["jira", "JIRA_CONNECTOR_CONFIG"],
  ["github", "GITHUB_CONNECTOR_CONFIG"],
  ["gitlab", "GITLAB_CONNECTOR_CONFIG"],
  ["notion", "NOTION_CONNECTOR_CONFIG"],
  ["slack", "SLACK_CONNECTOR_CONFIG"],
  ["teams", "TEAMS_CONNECTOR_CONFIG"],
  ["linear", "LINEAR_CONNECTOR_CONFIG"],
  ["hubspot", "HUBSPOT_CONNECTOR_CONFIG"],
  ["salesforce", "SALESFORCE_CONNECTOR_CONFIG"],
  ["zendesk", "ZENDESK_CONNECTOR_CONFIG"],
  ["clickup", "CLICKUP_CONNECTOR_CONFIG"],
];

for (const [folder, configName] of configs) {
  const dir = path.join(root, folder);
  fs.mkdirSync(dir, { recursive: true });

  const upper = folder.toUpperCase().replace(/-/g, "_");

  fs.writeFileSync(
    path.join(dir, "types.ts"),
    `import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { ${configName} } from "@/lib/connectors/definitions";

export type ${capitalize(folder)}Resource = {
  id: string;
  name: string;
  type: string;
};

export const ${upper}_CONFIG = ${configName};
export type ${capitalize(folder)}ConnectorConfig = typeof ${upper}_CONFIG;
`,
  );

  fs.writeFileSync(
    path.join(dir, "auth.ts"),
    `import { ${configName} } from "@/lib/connectors/definitions";
import { buildOAuthEnvKeys, isOAuthConfigured } from "@/lib/connectors/shared/module-config";
import { buildAuthorizeUrl, isConnectorOAuthConfigured } from "@/lib/connectors/oauth";

export const AUTH_CONFIG = ${configName};

export function getOAuthEnvKeys() {
  return buildOAuthEnvKeys(AUTH_CONFIG.authEnvPrefix);
}

export function isAuthConfigured(): boolean {
  return isConnectorOAuthConfigured(AUTH_CONFIG);
}

export function buildAuthorizationUrl(input: {
  redirectUri: string;
  state: string;
  scopes?: string[];
  codeVerifier?: string | null;
}) {
  return buildAuthorizeUrl(AUTH_CONFIG, {
    connectorId: AUTH_CONFIG.id,
    redirectUri: input.redirectUri,
    state: input.state,
    scopes: input.scopes ?? [...AUTH_CONFIG.defaultScopes],
    codeVerifier: input.codeVerifier,
  });
}
`,
  );

  fs.writeFileSync(
    path.join(dir, "client.ts"),
    `import "server-only";
import { ${configName} } from "@/lib/connectors/definitions";
import { createConnectorClient, type ConnectorClient } from "@/lib/connectors/shared/client-factory";

export async function create${capitalize(folder)}Client(
  organizationId: string,
  connectionId: string,
): Promise<ConnectorClient> {
  return createConnectorClient(organizationId, connectionId, ${configName});
}
`,
  );

  fs.writeFileSync(
    path.join(dir, "mapper.ts"),
    `import type { ${capitalize(folder)}Resource } from "@/lib/connectors/${folder}/types";

export function mapExternalRecord(record: Record<string, unknown>): ${capitalize(folder)}Resource {
  return {
    id: String(record.id ?? "unknown"),
    name: String(record.name ?? record.title ?? "Unnamed"),
    type: String(record.type ?? "resource"),
  };
}

export function mapExternalRecords(records: Record<string, unknown>[]): ${capitalize(folder)}Resource[] {
  return records.map(mapExternalRecord);
}
`,
  );

  fs.writeFileSync(
    path.join(dir, "health.ts"),
    `import "server-only";
import { ${configName} } from "@/lib/connectors/definitions";
import { evaluateConnectorHealth } from "@/lib/connectors/shared/health-factory";
import type { ConnectorHealthResult } from "@/lib/connectors/types";

export async function check${capitalize(folder)}Health(
  organizationId: string,
  connectionId: string | null,
): Promise<ConnectorHealthResult> {
  return evaluateConnectorHealth(organizationId, connectionId, ${configName});
}
`,
  );

  fs.writeFileSync(
    path.join(dir, "sync.ts"),
    `import "server-only";
import { ${configName} } from "@/lib/connectors/definitions";
import { runConnectorSync, type SyncEngineResult } from "@/lib/connectors/sync";
import type { ConnectorSyncType } from "@/lib/connectors/types";

export async function sync${capitalize(folder)}(input: {
  organizationId: string;
  connectionId: string;
  syncType: ConnectorSyncType;
}): Promise<SyncEngineResult> {
  return runConnectorSync({
    organizationId: input.organizationId,
    connectionId: input.connectionId,
    connectorId: ${configName}.id,
    config: ${configName},
    syncType: input.syncType,
  });
}
`,
  );

  fs.writeFileSync(
    path.join(dir, "webhook.ts"),
    `import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { ${configName} } from "@/lib/connectors/definitions";

export type ${capitalize(folder)}WebhookEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
};

export function parse${capitalize(folder)}Webhook(
  payload: Record<string, unknown>,
): ${capitalize(folder)}WebhookEvent {
  return {
    id: String(payload.id ?? payload.event_id ?? "unknown"),
    type: String(payload.type ?? payload.event ?? "unknown"),
    payload,
  };
}

export function validate${capitalize(folder)}WebhookSignature(
  _secret: string,
  _body: string,
  _signature: string | null,
): boolean {
  return Boolean(_signature);
}

export const WEBHOOK_CONFIG: ConnectorModuleConfig = ${configName};
`,
  );

  fs.writeFileSync(
    path.join(dir, "index.ts"),
    `export type { ${capitalize(folder)}Resource, ${capitalize(folder)}ConnectorConfig } from "@/lib/connectors/${folder}/types";
export { ${upper}_CONFIG } from "@/lib/connectors/${folder}/types";
export {
  AUTH_CONFIG,
  buildAuthorizationUrl,
  getOAuthEnvKeys,
  isAuthConfigured,
} from "@/lib/connectors/${folder}/auth";
export { create${capitalize(folder)}Client } from "@/lib/connectors/${folder}/client";
export { mapExternalRecord, mapExternalRecords } from "@/lib/connectors/${folder}/mapper";
export { check${capitalize(folder)}Health } from "@/lib/connectors/${folder}/health";
export { sync${capitalize(folder)} } from "@/lib/connectors/${folder}/sync";
export {
  parse${capitalize(folder)}Webhook,
  validate${capitalize(folder)}WebhookSignature,
  WEBHOOK_CONFIG,
  type ${capitalize(folder)}WebhookEvent,
} from "@/lib/connectors/${folder}/webhook";
`,
  );
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

console.log(`Generated ${configs.length} connector modules.`);
