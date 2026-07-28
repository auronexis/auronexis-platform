import "server-only";

import { isAIProviderConfigured } from "@/lib/ai/provider-labels";
import { resolveAIProvider } from "@/lib/ai/server/resolve-provider";
import { APP_VERSION } from "@/lib/company/contact";
import { checkDatabaseHealth } from "@/lib/diagnostics/platform-health";
import { isFastSpringApiConfigured, isFastSpringWebhookConfigured } from "@/lib/fastspring/env";
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
    /** FastSpring billing configured (sole active provider). */
    fastspring: boolean;
    /**
     * @deprecated Alias of `fastspring` for older monitors that read `paddle`.
     * Prefer `fastspring`.
     */
    paddle: boolean;
    /**
     * @deprecated Alias of `fastspring` for older monitors — not Stripe.
     * Prefer `fastspring`.
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

  const fastspringConfigured = isFastSpringApiConfigured() && isFastSpringWebhookConfigured();

  const aiConfigured = isAIProviderConfigured(provider.id);

  const configuration = {
    database: database.level !== "unavailable",
    supabase: supabaseConfigured,
    fastspring: fastspringConfigured,
    paddle: fastspringConfigured,
    stripe: fastspringConfigured,
    ai: aiConfigured,
  };

  const status: PlatformHealthStatus =
    database.level === "unavailable"
      ? "unavailable"
      : configuration.supabase && configuration.database
        ? configuration.fastspring && configuration.ai
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
