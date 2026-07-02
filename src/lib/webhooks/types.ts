/** Outbound webhook event types — Sprint 20 V1. */
export const WEBHOOK_EVENTS = [
  "client.created",
  "client.updated",
  "health.changed",
  "risk.created",
  "risk.updated",
  "incident.created",
  "incident.resolved",
  "report.published",
  "sla.breached",
  "monitoring.event_detected",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];

export type WebhookEndpointView = {
  id: string;
  organizationId: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WebhookDeliveryView = {
  id: string;
  endpointId: string;
  eventType: string;
  status: string;
  attempts: number;
  responseStatus: number | null;
  responseBody: string | null;
  deliveredAt: string | null;
  createdAt: string;
};

export type CreateWebhookEndpointResult = {
  endpoint: WebhookEndpointView;
  signingSecret: string;
};
