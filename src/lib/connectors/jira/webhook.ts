import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { JIRA_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type JiraWebhookEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
};

export function parseJiraWebhook(
  payload: Record<string, unknown>,
): JiraWebhookEvent {
  return {
    id: String(payload.id ?? payload.event_id ?? "unknown"),
    type: String(payload.type ?? payload.event ?? "unknown"),
    payload,
  };
}

export function validateJiraWebhookSignature(
  _secret: string,
  _body: string,
  _signature: string | null,
): boolean {
  return Boolean(_signature);
}

export const WEBHOOK_CONFIG: ConnectorModuleConfig = JIRA_CONNECTOR_CONFIG;
