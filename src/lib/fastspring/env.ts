import "server-only";

/**
 * FastSpring webhook HMAC secret — server-only.
 * Never import from Client Components. Never use NEXT_PUBLIC_.
 */
export function getFastSpringWebhookSecret(): string {
  const value = process.env.FASTSPRING_WEBHOOK_SECRET?.trim();
  if (!value) {
    throw new Error("Missing required environment variable: FASTSPRING_WEBHOOK_SECRET");
  }
  return value;
}

/** True when the inbound webhook secret is configured (presence only — never log the value). */
export function isFastSpringWebhookConfigured(): boolean {
  return Boolean(process.env.FASTSPRING_WEBHOOK_SECRET?.trim());
}
