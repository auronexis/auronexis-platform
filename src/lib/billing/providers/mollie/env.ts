import "server-only";

import type { MollieApiMode } from "@/lib/billing/providers/mollie/mode";
import { resolveMollieApiModeFromKey } from "@/lib/billing/providers/mollie/mode";

/**
 * Mollie API key — server-only.
 * Never import from Client Components. Never use NEXT_PUBLIC_.
 */
export function getMollieApiKey(): string {
  const value = process.env.MOLLIE_API_KEY?.trim();
  if (!value) {
    throw new Error("Missing required environment variable: MOLLIE_API_KEY");
  }
  return value;
}

/** Presence-only check for Mollie API credentials (never logs the key). */
export function isMollieApiConfigured(): boolean {
  return Boolean(process.env.MOLLIE_API_KEY?.trim());
}

export function getMollieApiKeyPresence(): {
  configured: boolean;
  mode: MollieApiMode | null;
  validKeyPrefix: boolean;
} {
  const raw = process.env.MOLLIE_API_KEY?.trim() ?? "";
  const configured = raw.length > 0;
  const mode = configured ? resolveMollieApiModeFromKey(raw) : null;
  return {
    configured,
    mode,
    validKeyPrefix: mode !== null,
  };
}
