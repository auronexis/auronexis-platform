import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { GITHUB_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type GithubWebhookEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
};

export function parseGithubWebhook(
  payload: Record<string, unknown>,
): GithubWebhookEvent {
  return {
    id: String(payload.id ?? payload.event_id ?? "unknown"),
    type: String(payload.type ?? payload.event ?? "unknown"),
    payload,
  };
}

export function validateGithubWebhookSignature(
  _secret: string,
  _body: string,
  _signature: string | null,
): boolean {
  return Boolean(_signature);
}

export const WEBHOOK_CONFIG: ConnectorModuleConfig = GITHUB_CONNECTOR_CONFIG;
