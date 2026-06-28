import "server-only";

import { createClient } from "@/lib/supabase/server";

export type HealthCheckResult = {
  ok: boolean;
  message: string;
  latencyMs?: number;
};

/** Lightweight database connectivity check — organization-scoped RLS session. */
export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const started = Date.now();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("organizations").select("id").limit(1);
    const latencyMs = Date.now() - started;

    if (error) {
      return { ok: false, message: "Database query failed", latencyMs };
    }

    return { ok: true, message: "Connected", latencyMs };
  } catch {
    return { ok: false, message: "Database unreachable", latencyMs: Date.now() - started };
  }
}

export function checkStripeHealth(stripeEnv: {
  secretKey: { present: boolean };
  webhookSecret: { present: boolean };
  publishableKey: { present: boolean };
}): HealthCheckResult {
  const missing: string[] = [];
  if (!stripeEnv.secretKey.present) missing.push("STRIPE_SECRET_KEY");
  if (!stripeEnv.webhookSecret.present) missing.push("STRIPE_WEBHOOK_SECRET");
  if (!stripeEnv.publishableKey.present) missing.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");

  if (missing.length > 0) {
    return { ok: false, message: `Missing: ${missing.join(", ")}` };
  }

  return { ok: true, message: "Stripe environment configured" };
}

export function getBuildInfo() {
  return {
    version: process.env.npm_package_version ?? "0.1.0",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    nodeEnv: process.env.NODE_ENV ?? "development",
    deploymentUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  };
}
