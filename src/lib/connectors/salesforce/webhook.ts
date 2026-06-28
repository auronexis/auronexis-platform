import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { SALESFORCE_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type SalesforceWebhookEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
};

export function parseSalesforceWebhook(
  payload: Record<string, unknown>,
): SalesforceWebhookEvent {
  return {
    id: String(payload.id ?? payload.event_id ?? "unknown"),
    type: String(payload.type ?? payload.event ?? "unknown"),
    payload,
  };
}

export function validateSalesforceWebhookSignature(
  _secret: string,
  _body: string,
  _signature: string | null,
): boolean {
  return Boolean(_signature);
}

export const WEBHOOK_CONFIG: ConnectorModuleConfig = SALESFORCE_CONNECTOR_CONFIG;
