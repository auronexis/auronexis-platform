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
    /** Paddle billing configured (sole active provider). */
    paddle: boolean;
    /**
     * @deprecated Alias of `paddle` for older monitors — not Stripe.
     * Prefer `paddle`.
     */
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

  const paddleConfigured = isPaddleConfigured();

  const aiConfigured = isAIProviderConfigured(provider.id);

  const configuration = {
    database: database.level !== "unavailable",
    supabase: supabaseConfigured,
    paddle: paddleConfigured,
    stripe: paddleConfigured,
    ai: aiConfigured,
  };

  const status: PlatformHealthStatus =
    database.level === "unavailable"
      ? "unavailable"
      : configuration.supabase && configuration.database
        ? configuration.paddle && configuration.ai
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
