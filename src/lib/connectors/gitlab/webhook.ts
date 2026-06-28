import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { GITLAB_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type GitlabWebhookEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
};

export function parseGitlabWebhook(
  payload: Record<string, unknown>,
): GitlabWebhookEvent {
  return {
    id: String(payload.id ?? payload.event_id ?? "unknown"),
    type: String(payload.type ?? payload.event ?? "unknown"),
    payload,
  };
}

export function validateGitlabWebhookSignature(
  _secret: string,
  _body: string,
  _signature: string | null,
): boolean {
  return Boolean(_signature);
}

export const WEBHOOK_CONFIG: ConnectorModuleConfig = GITLAB_CONNECTOR_CONFIG;
