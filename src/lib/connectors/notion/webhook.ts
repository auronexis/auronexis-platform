import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { NOTION_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type NotionWebhookEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
};

export function parseNotionWebhook(
  payload: Record<string, unknown>,
): NotionWebhookEvent {
  return {
    id: String(payload.id ?? payload.event_id ?? "unknown"),
    type: String(payload.type ?? payload.event ?? "unknown"),
    payload,
  };
}

export function validateNotionWebhookSignature(
  _secret: string,
  _body: string,
  _signature: string | null,
): boolean {
  return Boolean(_signature);
}

export const WEBHOOK_CONFIG: ConnectorModuleConfig = NOTION_CONNECTOR_CONFIG;
