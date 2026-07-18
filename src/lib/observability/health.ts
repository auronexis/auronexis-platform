import "server-only";

import { isAIProviderConfigured } from "@/lib/ai/provider-labels";
import { resolveAIProvider } from "@/lib/ai/server/resolve-provider";
import { APP_VERSION } from "@/lib/company/contact";
import { checkDatabaseHealth } from "@/lib/diagnostics/platform-health";
import { isPaddleConfigured } from "@/lib/paddle/env";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

export type PlatformHealthStatus = "healthy" | "degraded" | "unavailable";

export type PlatformHealthSnapshot = {
  status: PlatformHealthStatus;
  version: string;
  timestamp: string;
  latencyMs: number;
  configuration: {
    database: boolean;
    supabase: boolean;
    /** @deprecated Field name kept for compat — now reflects Paddle, not Stripe. */
    stripe: boolean;
    ai: boolean;
  };
};

export async function getPlatformHealthSnapshot(): Promise<PlatformHealthSnapshot> {
  const started = Date.now();
  const database = await checkDatabaseHealth();
  const { provider } = resolveAIProvider();

  let supabaseConfigured = false;
  try {
    getSupabaseUrl();
    getSupabaseAnonKey();
    supabaseConfigured = true;
  } catch {
    supabaseConfigured = false;
  }

  const stripeConfigured = isPaddleConfigured();

  const aiConfigured = isAIProviderConfigured(provider.id);

  const configuration = {
    database: database.level !== "unavailable",
    supabase: supabaseConfigured,
    stripe: stripeConfigured,
    ai: aiConfigured,
  };

  const status: PlatformHealthStatus =
    database.level === "unavailable"
      ? "unavailable"
      : configuration.supabase && configuration.database
        ? configuration.stripe && configuration.ai
          ? "healthy"
          : "degraded"
        : "degraded";

  return {
    status,
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - started,
    configuration,
  };
}
