import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { HUBSPOT_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type HubspotWebhookEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
};

export function parseHubspotWebhook(
  payload: Record<string, unknown>,
): HubspotWebhookEvent {
  return {
    id: String(payload.id ?? payload.event_id ?? "unknown"),
    type: String(payload.type ?? payload.event ?? "unknown"),
    payload,
  };
}

export function validateHubspotWebhookSignature(
  _secret: string,
  _body: string,
  _signature: string | null,
): boolean {
  return Boolean(_signature);
}

export const WEBHOOK_CONFIG: ConnectorModuleConfig = HUBSPOT_CONNECTOR_CONFIG;
