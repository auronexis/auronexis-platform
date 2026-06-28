import "server-only";

import type { EnvVarStatus, StripeEnvDiagnostics } from "@/lib/diagnostics/types";

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function maskPublicValue(value: string): string {
  if (value.length <= 6) {
    return value;
  }

  return `…${value.slice(-6)}`;
}

function envStatus(name: string, showPreview = false): EnvVarStatus {
  const value = readEnv(name);

  return {
    name,
    present: Boolean(value),
    preview: showPreview && value ? maskPublicValue(value) : undefined,
  };
}

export function getStripeEnvDiagnostics(): StripeEnvDiagnostics {
  return {
    starterPriceId: envStatus("STRIPE_STARTER_PRICE_ID", true),
    professionalPriceId: envStatus("STRIPE_PROFESSIONAL_PRICE_ID", true),
    businessPriceId: envStatus("STRIPE_BUSINESS_PRICE_ID", true),
    enterprisePriceId: envStatus("STRIPE_ENTERPRISE_PRICE_ID", true),
    webhookSecret: envStatus("STRIPE_WEBHOOK_SECRET"),
    secretKey: envStatus("STRIPE_SECRET_KEY"),
    publishableKey: envStatus("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", true),
  };
}

export function isStripePriceIdConfigured(planEnvKey: keyof StripeEnvDiagnostics): boolean {
  return getStripeEnvDiagnostics()[planEnvKey].present;
}

export function isStripeCheckoutReady(): boolean {
  const env = getStripeEnvDiagnostics();
  return env.secretKey.present && env.publishableKey.present;
}
