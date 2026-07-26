import type {
  FastSpringOrderSnapshot,
  FastSpringSubscriptionSnapshot,
  FastSpringWebhookEventEnvelope,
  FastSpringWebhookPayload,
} from "@/lib/fastspring/types";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Extract string key/value tags from a FastSpring tags object when present.
 * Order tags are documented as key/value pairings returned on orders
 * (https://developer.fastspring.com/docs/manage-custom-orders).
 * Missing or non-object tags yield an empty map — never invent keys.
 */
export function extractStringTags(value: unknown): Record<string, string> {
  const record = asRecord(value);
  const tags: Record<string, string> = {};
  for (const [key, raw] of Object.entries(record)) {
    const str = asString(raw);
    if (str) {
      tags[key] = str;
    }
  }
  return tags;
}

function extractAccountId(data: Record<string, unknown>): string | null {
  const account = data.account;
  if (typeof account === "string") {
    return asString(account);
  }
  const accountObj = asRecord(account);
  return asString(accountObj.id) ?? asString(accountObj.account);
}

function extractCustomLookupId(data: Record<string, unknown>): string | null {
  const accountObj = asRecord(data.account);
  const lookup = asRecord(accountObj.lookup);
  // Documented: account.lookup.custom — custom account ID via FastSpring /accounts API
  return asString(lookup.custom);
}

function extractProductPath(data: Record<string, unknown>): string | null {
  const product = data.product;
  if (typeof product === "string") {
    return asString(product);
  }
  const productObj = asRecord(product);
  const fromProduct = asString(productObj.product) ?? asString(productObj.path);
  if (fromProduct) {
    return fromProduct;
  }

  const items = data.items;
  if (Array.isArray(items) && items.length > 0) {
    const first = asRecord(items[0]);
    return asString(first.product);
  }
  return null;
}

function extractSubscriptionId(data: Record<string, unknown>): string | null {
  return asString(data.id) ?? asString(data.subscription);
}

function extractOrderId(data: Record<string, unknown>): string | null {
  return asString(data.id) ?? asString(data.order);
}

/**
 * Parse the FastSpring webhook JSON envelope after signature verification.
 * Throws on structurally invalid payloads.
 */
export function parseFastSpringWebhookPayload(rawBody: string): FastSpringWebhookPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch {
    throw new Error("Malformed FastSpring webhook JSON.");
  }

  const root = asRecord(parsed);
  const eventsRaw = root.events;
  if (!Array.isArray(eventsRaw)) {
    throw new Error("FastSpring webhook payload missing events array.");
  }

  const events: FastSpringWebhookEventEnvelope[] = [];
  for (const entry of eventsRaw) {
    const event = asRecord(entry);
    const id = asString(event.id);
    const type = asString(event.type);
    if (!id || !type) {
      throw new Error("FastSpring webhook event missing id or type.");
    }
    events.push({
      id,
      type,
      live: asBoolean(event.live) ?? undefined,
      processed: asBoolean(event.processed) ?? undefined,
      created: asNumber(event.created) ?? undefined,
      data: asRecord(event.data),
    });
  }

  return { events };
}

export function extractSubscriptionSnapshot(
  data: Record<string, unknown>,
): FastSpringSubscriptionSnapshot {
  return {
    subscriptionId: extractSubscriptionId(data),
    accountId: extractAccountId(data),
    productPath: extractProductPath(data),
    state: asString(data.state),
    active: asBoolean(data.active),
    currency: asString(data.currency),
    tags: extractStringTags(data.tags),
    customLookupId: extractCustomLookupId(data),
  };
}

export function extractOrderSnapshot(data: Record<string, unknown>): FastSpringOrderSnapshot {
  const total = asNumber(data.total) ?? asNumber(data.subtotal);
  // FastSpring order amounts are typically major currency units (not cents).
  // Store cents only when we have a finite number — multiply by 100 for ledger consistency.
  const totalInCents =
    total === null ? null : Math.round(total * 100);

  return {
    orderId: extractOrderId(data),
    reference: asString(data.reference),
    accountId: extractAccountId(data),
    completed: asBoolean(data.completed),
    currency: asString(data.currency),
    invoiceUrl: asString(data.invoiceUrl),
    productPath: extractProductPath(data),
    tags: extractStringTags(data.tags),
    customLookupId: extractCustomLookupId(data),
    totalInCents,
  };
}

export function occurredAtFromEventCreated(created: number | undefined): string | null {
  if (typeof created !== "number" || !Number.isFinite(created)) {
    return null;
  }
  const ms = created < 1_000_000_000_000 ? created * 1000 : created;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
