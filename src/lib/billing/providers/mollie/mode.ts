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

/** Resolve credential mode from server env — null when missing or unknown prefix. */
export function getMollieCredentialMode(): MollieApiMode | null {
  const raw = process.env.MOLLIE_API_KEY?.trim();
  if (!raw) {
    return null;
  }
  return resolveMollieApiModeFromKey(raw);
}

/**
 * Fail closed unless MOLLIE_API_KEY is present and TEST-prefixed.
 * Phase 2 isolated test lifecycle and any TEST-only surfaces must call this first.
 */
export function assertMollieTestModeOnly(): void {
  const mode = getMollieCredentialMode();
  if (mode !== "test") {
    throw new Error(
      "Mollie payment operations require TEST mode credentials (test_ prefix). Live, unknown, or missing keys are rejected.",
    );
  }
}

/**
 * Phase 3 production payment ops guard.
 * - TEST keys always allowed when configured.
 * - LIVE keys require explicit MOLLIE_LIVE_CHARGING_ENABLED — default fail closed.
 * Never mixes modes; never invents credentials.
 * LIVE kill switch is independent from MOLLIE_BILLING_ROLLOUT.
 */
export function assertMolliePaymentOpsAllowed(): MollieApiMode {
  const mode = getMollieCredentialMode();
  if (mode === "test") {
    return "test";
  }

  if (mode === "live") {
    // Inline env read keeps mode.ts free of rollout import cycles at module init.
    const liveEnabled =
      process.env.MOLLIE_LIVE_CHARGING_ENABLED?.trim().toLowerCase() === "1" ||
      process.env.MOLLIE_LIVE_CHARGING_ENABLED?.trim().toLowerCase() === "true" ||
      process.env.MOLLIE_LIVE_CHARGING_ENABLED?.trim().toLowerCase() === "yes" ||
      process.env.MOLLIE_LIVE_CHARGING_ENABLED?.trim().toLowerCase() === "on";

    if (!liveEnabled) {
      throw new Error(
        "Mollie LIVE charging is disabled. Set MOLLIE_LIVE_CHARGING_ENABLED=true only after explicit go-live approval.",
      );
    }
    return "live";
  }

  throw new Error(
    "Mollie payment operations require a valid MOLLIE_API_KEY (test_ or live_ prefix).",
  );
}
