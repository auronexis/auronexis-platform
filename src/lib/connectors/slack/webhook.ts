import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { SLACK_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type SlackWebhookEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
};

export function parseSlackWebhook(
  payload: Record<string, unknown>,
): SlackWebhookEvent {
  return {
    id: String(payload.id ?? payload.event_id ?? "unknown"),
    type: String(payload.type ?? payload.event ?? "unknown"),
    payload,
  };
}

export function validateSlackWebhookSignature(
  _secret: string,
  _body: string,
  _signature: string | null,
): boolean {
  return Boolean(_signature);
}

export const WEBHOOK_CONFIG: ConnectorModuleConfig = SLACK_CONNECTOR_CONFIG;
