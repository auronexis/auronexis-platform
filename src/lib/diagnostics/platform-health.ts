import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getActiveBillingProvider } from "@/lib/billing/provider";
import { probeFastSpringApiConnectivity } from "@/lib/fastspring/connectivity";
import {
  getFastSpringApiCredentialPresence,
  isFastSpringWebhookConfigured,
} from "@/lib/fastspring/env";
import {
  getMollieApiKeyPresence,
  isMollieApiConfigured,
  probeMollieApiConnectivity,
} from "@/lib/billing/providers/mollie";
import { isFastSpringStorefrontConfigured } from "@/lib/fastspring/storefront";

export type DatabaseHealthLevel = "healthy" | "degraded" | "unavailable";

export type HealthCheckResult = {
  /** True when database is reachable (healthy or degraded). False only when unavailable. */
  ok: boolean;
  level: DatabaseHealthLevel;
  message: string;
  latencyMs?: number;
};

function finish(
  level: DatabaseHealthLevel,
  message: string,
  started: number,
): HealthCheckResult {
  return {
    ok: level !== "unavailable",
    level,
    message,
    latencyMs: Date.now() - started,
  };
}

function isRlsOrPermissionError(error: { code?: string; message?: string }): boolean {
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();
  return (
    code === "42501" ||
    code === "PGRST301" ||
    message.includes("permission denied") ||
    message.includes("row-level security") ||
    message.includes("row level security") ||
    message.includes("jwt")
  );
}

function isAuthOrConfigError(error: { code?: string; message?: string }): boolean {
  const message = (error.message ?? "").toLowerCase();
  return (
    message.includes("invalid api key") ||
    message.includes("invalid jwt") ||
    message.includes("apikey") ||
    error.code === "401"
  );
}

/** Lightweight database connectivity — service-role probe with RLS-safe public fallback. */
export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const started = Date.now();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !anonKey) {
    console.error(
      "[database-health] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
    return finish("unavailable", "Supabase environment not configured", started);
  }

  if (serviceKey) {
    try {
      const admin = createAdminClient();
      const { error } = await admin
        .from("organizations")
        .select("id", { count: "exact", head: true });

      if (!error) {
        return finish("healthy", "Connected", started);
      }

      if (isRlsOrPermissionError(error)) {
        console.warn("[database-health] Service role probe returned permission error:", error);
        return finish("degraded", "Connected (permission probe limited)", started);
      }

      if (isAuthOrConfigError(error)) {
        console.error("[database-health] Supabase auth/config error:", error);
        return finish("unavailable", "Database authentication failed", started);
      }

      console.error("[database-health] Service role probe failed:", error);
      return finish("unavailable", "Database query failed", started);
    } catch (error) {
      console.error("[database-health] Service role connection failed:", error);
      return finish("unavailable", "Database unreachable", started);
    }
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("organizations")
      .select("id", { count: "exact", head: true });

    if (!error) {
      return finish("healthy", "Connected", started);
    }

    if (isRlsOrPermissionError(error)) {
      console.warn("[database-health] Public probe blocked by RLS (degraded):", error.message);
      return finish("degraded", "Connected (public probe limited)", started);
    }

    if (isAuthOrConfigError(error)) {
      console.error("[database-health] Supabase auth/config error on public probe:", error);
      return finish("unavailable", "Database authentication failed", started);
    }

    console.error("[database-health] Public probe failed:", error);
    return finish("unavailable", "Database query failed", started);
  } catch (error) {
    console.error("[database-health] Public connection failed:", error);
    return finish("unavailable", "Database unreachable", started);
  }
}

/**
 * Legacy Paddle billing configuration health — the Paddle SDK/runtime has
 * been fully removed; FastSpring is the sole active billing provider.
 * Always reports not-configured. Retained (function name + field) only for
 * backward compatibility with existing dashboards reading `stripeHealth` /
 * `stripeConnected` on diagnostics snapshots.
 */
export function checkPaddleHealth(): HealthCheckResult {
  return {
    ok: false,
    level: "degraded",
    message: "Paddle runtime removed — FastSpring is the sole active billing provider",
  };
}

/**
 * FastSpring inbound webhook secret presence — never returns or logs the secret.
 */
export function checkFastSpringWebhookHealth(): HealthCheckResult {
  if (!isFastSpringWebhookConfigured()) {
    return {
      ok: false,
      level: "degraded",
      message: "FASTSPRING_WEBHOOK_SECRET configured: no",
    };
  }

  return {
    ok: true,
    level: "healthy",
    message: "FASTSPRING_WEBHOOK_SECRET configured: yes",
  };
}

/**
 * FastSpring REST API credential presence — never returns or logs credential values.
 */
export function checkFastSpringApiConfigHealth(): HealthCheckResult {
  const presence = getFastSpringApiCredentialPresence();
  if (!presence.configured) {
    return {
      ok: false,
      level: "degraded",
      message: "FASTSPRING_API credentials configured: no",
    };
  }

  return {
    ok: true,
    level: "healthy",
    message: "FASTSPRING_API credentials configured: yes",
  };
}

/**
 * Live FastSpring API auth probe (read-only). Sanitized result only — no secrets.
 */
export async function checkFastSpringApiConnectivityHealth(): Promise<HealthCheckResult> {
  const result = await probeFastSpringApiConnectivity();
  if (result.connected) {
    return {
      ok: true,
      level: "healthy",
      message: `FastSpring API connected (HTTP ${result.httpStatus ?? 200})`,
    };
  }

  if (result.errorCategory === "not_configured") {
    return {
      ok: false,
      level: "degraded",
      message: "FastSpring API credentials configured: no",
    };
  }

  return {
    ok: false,
    level: "degraded",
    message: `FastSpring API not connected (${result.errorCategory ?? "unknown"}${
      result.httpStatus ? `, HTTP ${result.httpStatus}` : ""
    })`,
  };
}

/** FastSpring Store Builder storefront presence (exact data-storefront). */
export function checkFastSpringStorefrontHealth(): HealthCheckResult {
  if (!isFastSpringStorefrontConfigured()) {
    return {
      ok: false,
      level: "degraded",
      message: "FastSpring storefront configured: no",
    };
  }
  return {
    ok: true,
    level: "healthy",
    message: "FastSpring storefront configured: yes",
  };
}

/**
 * Mollie API key presence — foundation only; Mollie is not the active billing provider.
 * Never returns or logs the key value.
 */
export function checkMollieApiConfigHealth(): HealthCheckResult {
  const presence = getMollieApiKeyPresence();
  if (!presence.configured) {
    return {
      ok: false,
      level: "degraded",
      message: "MOLLIE_API_KEY configured: no (foundation — not active billing)",
    };
  }

  if (!presence.validKeyPrefix) {
    return {
      ok: false,
      level: "degraded",
      message: "MOLLIE_API_KEY prefix invalid — expected test_ or live_",
    };
  }

  return {
    ok: true,
    level: "healthy",
    message: `MOLLIE_API_KEY configured: yes (${presence.mode ?? "unknown"} mode, foundation only)`,
  };
}

/**
 * Live Mollie API auth probe (read-only methods.list). Sanitized result only — no secrets.
 */
export async function checkMollieApiConnectivityHealth(): Promise<HealthCheckResult> {
  const result = await probeMollieApiConnectivity();
  if (result.connected) {
    return {
      ok: true,
      level: "healthy",
      message: `Mollie API connected (${result.mode ?? "unknown"} mode, read-only probe)`,
    };
  }

  if (result.errorCategory === "not_configured") {
    return {
      ok: false,
      level: "degraded",
      message: "MOLLIE_API_KEY configured: no (foundation — not active billing)",
    };
  }

  if (result.errorCategory === "invalid_key_prefix") {
    return {
      ok: false,
      level: "degraded",
      message: "MOLLIE_API_KEY prefix invalid — expected test_ or live_",
    };
  }

  return {
    ok: false,
    level: "degraded",
    message: `Mollie API not connected (${result.errorCategory ?? "unknown"})`,
  };
}

/** Whether Mollie foundation credentials are present (no key value). */
export function isMollieFoundationConfigured(): boolean {
  return isMollieApiConfigured();
}

/** Active billing provider label for diagnostics (no secrets). */
export function checkActiveBillingProviderHealth(): HealthCheckResult {
  const provider = getActiveBillingProvider();
  if (provider === "fastspring") {
    return {
      ok: true,
      level: "healthy",
      message: "Active billing provider: fastspring (legacy Paddle entitlements preserved)",
    };
  }
  return {
    ok: true,
    level: "healthy",
    message: `Active billing provider: ${provider}`,
  };
}

export function getBuildInfo() {
  return {
    version: process.env.npm_package_version ?? "0.1.0",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    nodeEnv: process.env.NODE_ENV ?? "development",
    deploymentUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  };
}
