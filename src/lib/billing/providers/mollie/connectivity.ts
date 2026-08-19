import "server-only";

import { createMollieBillingClient } from "@/lib/billing/providers/mollie/client";
import { getMollieApiKey, getMollieApiKeyPresence } from "@/lib/billing/providers/mollie/env";
import type { MollieApiMode } from "@/lib/billing/providers/mollie/mode";
import { resolveMollieApiModeFromKey } from "@/lib/billing/providers/mollie/mode";

/**
 * Harmless read-only Mollie connectivity probe.
 * Lists enabled payment methods — no charge, customer, mandate, or subscription creation.
 * https://docs.mollie.com/reference/list-methods
 */
export const MOLLIE_CONNECTIVITY_OPERATION = "methods.list()";

export type MollieConnectivityErrorCategory =
  | "not_configured"
  | "invalid_key_prefix"
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "network_error"
  | "timeout"
  | "unexpected_error";

export type MollieConnectivityResult = {
  configured: boolean;
  validKeyPrefix: boolean;
  mode: MollieApiMode | null;
  connected: boolean;
  errorCategory: MollieConnectivityErrorCategory | null;
  operation: typeof MOLLIE_CONNECTIVITY_OPERATION;
};

const REQUEST_TIMEOUT_MS = 12_000;

function categorizeMollieError(error: unknown): MollieConnectivityErrorCategory {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "timeout";
    }

    const message = error.message.toLowerCase();
    if (message.includes("401") || message.includes("unauthorized")) {
      return "unauthorized";
    }
    if (message.includes("403") || message.includes("forbidden")) {
      return "forbidden";
    }
    if (message.includes("429") || message.includes("rate limit")) {
      return "rate_limited";
    }
    if (message.includes("fetch") || message.includes("network")) {
      return "network_error";
    }
  }

  return "unexpected_error";
}

/**
 * Probe Mollie API authentication from the current server environment.
 * Never returns credentials, API keys, or response payloads.
 */
export async function probeMollieApiConnectivity(): Promise<MollieConnectivityResult> {
  const presence = getMollieApiKeyPresence();
  const base = {
    configured: presence.configured,
    validKeyPrefix: presence.validKeyPrefix,
    mode: presence.mode,
    operation: MOLLIE_CONNECTIVITY_OPERATION,
  } as const;

  if (!presence.configured) {
    return {
      ...base,
      connected: false,
      errorCategory: "not_configured",
    };
  }

  if (!presence.validKeyPrefix) {
    return {
      ...base,
      connected: false,
      errorCategory: "invalid_key_prefix",
    };
  }

  let client;
  try {
    client = createMollieBillingClient();
  } catch {
    return {
      ...base,
      connected: false,
      errorCategory: "invalid_key_prefix",
    };
  }

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(Object.assign(new Error("timeout"), { name: "AbortError" }));
    }, REQUEST_TIMEOUT_MS);
  });

  try {
    await Promise.race([client.methods.list(), timeoutPromise]);

    return {
      ...base,
      mode: resolveMollieApiModeFromKey(getMollieApiKey()),
      connected: true,
      errorCategory: null,
    };
  } catch (error) {
    const errorCategory = categorizeMollieError(error);
    console.error("[mollie] api connectivity probe failed", {
      errorCategory,
      mode: presence.mode,
    });

    return {
      ...base,
      connected: false,
      errorCategory,
    };
  }
}
