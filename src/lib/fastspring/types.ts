/**
 * Conservative FastSpring webhook types based on documented payload shapes.
 * Only fields confirmed in FastSpring developer docs are modeled.
 *
 * Envelope: https://developer.fastspring.com/reference/webhooks-overview
 * Subscription data: https://developer.fastspring.com/reference/webhook-expansion
 * Order data: https://developer.fastspring.com/reference/ordercompleted
 */

export type FastSpringWebhookEventEnvelope = {
  id: string;
  type: string;
  live?: boolean;
  processed?: boolean;
  /** Epoch milliseconds when FastSpring created the event. */
  created?: number;
  data: Record<string, unknown>;
};

export type FastSpringWebhookPayload = {
  events: FastSpringWebhookEventEnvelope[];
};

export type FastSpringAccountRef = {
  id: string | null;
  customLookupId: string | null;
};

export type FastSpringSubscriptionSnapshot = {
  subscriptionId: string | null;
  accountId: string | null;
  productPath: string | null;
  state: string | null;
  active: boolean | null;
  currency: string | null;
  tags: Record<string, string>;
  customLookupId: string | null;
};

export type FastSpringOrderSnapshot = {
  orderId: string | null;
  reference: string | null;
  accountId: string | null;
  completed: boolean | null;
  currency: string | null;
  invoiceUrl: string | null;
  productPath: string | null;
  tags: Record<string, string>;
  customLookupId: string | null;
  totalInCents: number | null;
};
