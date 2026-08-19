/**
 * Mollie API key mode — derived from key prefix only.
 * Profile-specific TEST keys must not force testmode=true on API calls unless required.
 */

export type MollieApiMode = "test" | "live";

/** Resolve TEST vs LIVE from key prefix. Unknown prefixes fail closed for payment ops. */
export function resolveMollieApiModeFromKey(apiKey: string): MollieApiMode | null {
  const trimmed = apiKey.trim();
  if (trimmed.startsWith("test_")) {
    return "test";
  }
  if (trimmed.startsWith("live_")) {
    return "live";
  }
  return null;
}

export function assertMollieApiModeForPaymentOps(apiKey: string): MollieApiMode {
  const mode = resolveMollieApiModeFromKey(apiKey);
  if (!mode) {
    throw new Error("Invalid MOLLIE_API_KEY prefix — expected test_ or live_");
  }
  return mode;
}
