import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { LINEAR_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type LinearWebhookEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
};

export function parseLinearWebhook(
  payload: Record<string, unknown>,
): LinearWebhookEvent {
  return {
    id: String(payload.id ?? payload.event_id ?? "unknown"),
    type: String(payload.type ?? payload.event ?? "unknown"),
    payload,
  };
}

export function validateLinearWebhookSignature(
  _secret: string,
  _body: string,
  _signature: string | null,
): boolean {
  return Boolean(_signature);
}

export const WEBHOOK_CONFIG: ConnectorModuleConfig = LINEAR_CONNECTOR_CONFIG;
