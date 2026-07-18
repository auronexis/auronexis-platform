import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isPaddleConfigured } from "@/lib/paddle/env";

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
 * Paddle billing configuration health — Stripe has been removed from active
 * billing. Field name kept as `stripeHealth` on diagnostics snapshots for
 * backward compatibility with existing dashboards.
 */
export function checkPaddleHealth(): HealthCheckResult {
  if (!isPaddleConfigured()) {
    return { ok: false, level: "degraded", message: "Paddle environment not configured" };
  }

  return { ok: true, level: "healthy", message: "Paddle environment configured" };
}

export function getBuildInfo() {
  return {
    version: process.env.npm_package_version ?? "0.1.0",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    nodeEnv: process.env.NODE_ENV ?? "development",
    deploymentUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  };
}
