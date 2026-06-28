import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { CLICKUP_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type ClickupWebhookEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
};

export function parseClickupWebhook(
  payload: Record<string, unknown>,
): ClickupWebhookEvent {
  return {
    id: String(payload.id ?? payload.event_id ?? "unknown"),
    type: String(payload.type ?? payload.event ?? "unknown"),
    payload,
  };
}

export function validateClickupWebhookSignature(
  _secret: string,
  _body: string,
  _signature: string | null,
): boolean {
  return Boolean(_signature);
}

export const WEBHOOK_CONFIG: ConnectorModuleConfig = CLICKUP_CONNECTOR_CONFIG;
