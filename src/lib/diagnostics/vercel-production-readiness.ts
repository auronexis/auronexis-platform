import "server-only";

import { PRODUCTION_DOMAIN_LIST } from "@/lib/deployment/production-domains";
import {
  isDevelopmentRuntime,
  isProductionRuntime,
  isVercelRuntime,
  resolveRuntimeEnvironmentScope,
  type RuntimeEnvironmentScope,
} from "@/lib/diagnostics/runtime-environment";
import { isEmailConfigured } from "@/lib/env/email";

export type VercelEnvironmentScope = RuntimeEnvironmentScope;

export type VercelProductionReadinessSnapshot = {
  productionConfigured: boolean;
  previewConfigured: boolean;
  developmentConfigured: boolean;
  /** Mollie billing env ready (sole active provider). */
  mollieEnvReady: boolean;
  oauthEnvReady: boolean;
  mailEnvReady: boolean;
  domainsDocumented: boolean;
  score: number;
  complete: boolean;
  label: "Vercel Production Ready" | "Vercel Production Incomplete";
};

const CORE_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
] as const;

const MOLLIE_ENV_KEYS = ["MOLLIE_API_KEY"] as const;

const MAIL_ENV_KEYS = [
  "EMAIL_PROVIDER",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_FROM",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "EMAIL_FROM",
] as const;

const OAUTH_ENV_KEYS = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] as const;

function scoreChecks(checks: boolean[]): number {
  if (checks.length === 0) return 0;
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function envPresent(keys: readonly string[]): boolean {
  return keys.every((key) => Boolean(process.env[key]?.trim()));
}

/** Phase 8 Sprint 0 — Vercel production, preview, development, and integration env checks. */
export function getVercelProductionReadinessSnapshot(): VercelProductionReadinessSnapshot {
  const isDev = isDevelopmentRuntime();
  const isProd = isProductionRuntime();
  const scope = resolveRuntimeEnvironmentScope();
  const coreEnvReady = envPresent(CORE_ENV_KEYS) || isDev;
  const mollieEnvReady = envPresent(MOLLIE_ENV_KEYS) || isDev;
  // OAuth credentials are optional customer connectors — not a Vercel production core blocker.
  const oauthEnvReady = envPresent(OAUTH_ENV_KEYS) || isDev;
  const mailEnvReady = isEmailConfigured() || isDev;
  const domainsDocumented = PRODUCTION_DOMAIN_LIST.length === 4;
  const vercelDetected = isVercelRuntime() || isDev;

  // Scope flags describe project capability, not "must be on all three scopes at once".
  const productionConfigured =
    coreEnvReady && (isProd || (scope === "production" && vercelDetected) || isDev);
  const previewConfigured = vercelDetected || scope === "preview" || isDev;
  const developmentConfigured = true;

  const checks = [
    productionConfigured,
    previewConfigured,
    developmentConfigured,
    mollieEnvReady,
    mailEnvReady,
    domainsDocumented,
    coreEnvReady,
    vercelDetected || isProd,
  ];

  const score = scoreChecks(checks);
  const complete = score >= 99;

  return {
    productionConfigured,
    previewConfigured,
    developmentConfigured,
    mollieEnvReady,
    oauthEnvReady,
    mailEnvReady,
    domainsDocumented,
    score,
    complete,
    label: complete ? "Vercel Production Ready" : "Vercel Production Incomplete",
  };
}

export const VERCEL_ENV_GROUPS = {
  core: CORE_ENV_KEYS,
  mollie: MOLLIE_ENV_KEYS,
  oauth: OAUTH_ENV_KEYS,
  mail: MAIL_ENV_KEYS,
} as const;
