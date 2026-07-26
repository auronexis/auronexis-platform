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

/** FastSpring API username — server-only. Never log or return the value. */
export function getFastSpringApiUsername(): string {
  const value = process.env.FASTSPRING_API_USERNAME?.trim();
  if (!value) {
    throw new Error("Missing required environment variable: FASTSPRING_API_USERNAME");
  }
  return value;
}

/** FastSpring API password — server-only. Never log or return the value. */
export function getFastSpringApiPassword(): string {
  const value = process.env.FASTSPRING_API_PASSWORD?.trim();
  if (!value) {
    throw new Error("Missing required environment variable: FASTSPRING_API_PASSWORD");
  }
  return value;
}

/** Presence-only check for FastSpring REST API credentials. */
export function isFastSpringApiConfigured(): boolean {
  return Boolean(
    process.env.FASTSPRING_API_USERNAME?.trim() && process.env.FASTSPRING_API_PASSWORD?.trim(),
  );
}

export function getFastSpringApiCredentialPresence(): {
  usernameConfigured: boolean;
  passwordConfigured: boolean;
  configured: boolean;
} {
  const usernameConfigured = Boolean(process.env.FASTSPRING_API_USERNAME?.trim());
  const passwordConfigured = Boolean(process.env.FASTSPRING_API_PASSWORD?.trim());
  return {
    usernameConfigured,
    passwordConfigured,
    configured: usernameConfigured && passwordConfigured,
  };
}
