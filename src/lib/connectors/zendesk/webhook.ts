import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { ZENDESK_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type ZendeskWebhookEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
};

export function parseZendeskWebhook(
  payload: Record<string, unknown>,
): ZendeskWebhookEvent {
  return {
    id: String(payload.id ?? payload.event_id ?? "unknown"),
    type: String(payload.type ?? payload.event ?? "unknown"),
    payload,
  };
}

export function validateZendeskWebhookSignature(
  _secret: string,
  _body: string,
  _signature: string | null,
): boolean {
  return Boolean(_signature);
}

export const WEBHOOK_CONFIG: ConnectorModuleConfig = ZENDESK_CONNECTOR_CONFIG;
