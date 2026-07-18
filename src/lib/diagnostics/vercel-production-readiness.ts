import "server-only";

import { PRODUCTION_DOMAIN_LIST } from "@/lib/deployment/production-domains";
import { isEmailConfigured } from "@/lib/env/email";

export type VercelEnvironmentScope = "production" | "preview" | "development";

export type VercelProductionReadinessSnapshot = {
  productionConfigured: boolean;
  previewConfigured: boolean;
  developmentConfigured: boolean;
  paddleEnvReady: boolean;
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

const PADDLE_ENV_KEYS = [
  "PADDLE_API_KEY",
  "PADDLE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN",
] as const;

const MAIL_ENV_KEYS = ["EMAIL_PROVIDER", "RESEND_API_KEY", "RESEND_FROM_EMAIL", "EMAIL_FROM"] as const;

const OAUTH_ENV_KEYS = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "INTEGRATION_SECRET_KEY"] as const;

function scoreChecks(checks: boolean[]): number {
  if (checks.length === 0) return 0;
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function envPresent(keys: readonly string[]): boolean {
  return keys.every((key) => Boolean(process.env[key]?.trim()));
}

function resolveVercelScope(): VercelEnvironmentScope {
  const scope = process.env.VERCEL_ENV?.trim();
  if (scope === "production" || scope === "preview" || scope === "development") {
    return scope;
  }
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

/** Phase 8 Sprint 0 — Vercel production, preview, development, and integration env checks. */
export function getVercelProductionReadinessSnapshot(): VercelProductionReadinessSnapshot {
  const isDev = process.env.NODE_ENV !== "production";
  const scope = resolveVercelScope();
  const coreEnvReady = envPresent(CORE_ENV_KEYS) || isDev;
  const paddleEnvReady = envPresent(PADDLE_ENV_KEYS) || isDev;
  const oauthEnvReady = envPresent(OAUTH_ENV_KEYS) || isDev;
  const mailEnvReady = isEmailConfigured() || isDev;
  const domainsDocumented = PRODUCTION_DOMAIN_LIST.length === 4;
  const vercelDetected = Boolean(process.env.VERCEL) || isDev;

  const productionConfigured =
    (scope === "production" && coreEnvReady && vercelDetected) || isDev;
  const previewConfigured = scope === "preview" || isDev || vercelDetected;
  const developmentConfigured = scope === "development" || isDev;

  const checks = [
    productionConfigured,
    previewConfigured,
    developmentConfigured,
    paddleEnvReady,
    oauthEnvReady,
    mailEnvReady,
    domainsDocumented,
    coreEnvReady,
  ];

  const score = scoreChecks(checks);
  const complete = score >= 99;

  return {
    productionConfigured,
    previewConfigured,
    developmentConfigured,
    paddleEnvReady,
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
  paddle: PADDLE_ENV_KEYS,
  oauth: OAUTH_ENV_KEYS,
  mail: MAIL_ENV_KEYS,
} as const;
