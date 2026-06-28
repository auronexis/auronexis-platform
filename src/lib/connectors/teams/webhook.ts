import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { TEAMS_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type TeamsWebhookEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
};

export function parseTeamsWebhook(
  payload: Record<string, unknown>,
): TeamsWebhookEvent {
  return {
    id: String(payload.id ?? payload.event_id ?? "unknown"),
    type: String(payload.type ?? payload.event ?? "unknown"),
    payload,
  };
}

export function validateTeamsWebhookSignature(
  _secret: string,
  _body: string,
  _signature: string | null,
): boolean {
  return Boolean(_signature);
}

export const WEBHOOK_CONFIG: ConnectorModuleConfig = TEAMS_CONNECTOR_CONFIG;
