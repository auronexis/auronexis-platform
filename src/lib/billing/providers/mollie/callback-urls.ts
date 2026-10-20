/**
 * Environment-specific Mollie webhook + return URL base.
 * Preview/local/TEST must never send Mollie callbacks to the production app host.
 */

import { PRODUCTION_DOMAINS } from "@/lib/deployment/production-domains";
import { getAppUrl } from "@/lib/env";
import { getMollieCredentialMode } from "@/lib/billing/providers/mollie/mode";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isProductionAppHost(url: string): boolean {
  const host = hostnameOf(url);
  if (!host) {
    return false;
  }
  return host === PRODUCTION_DOMAINS.app || host === PRODUCTION_DOMAINS.www || host === PRODUCTION_DOMAINS.apex;
}

function isSafeNonProductionHost(url: string): boolean {
  const host = hostnameOf(url);
  if (!host) {
    return false;
  }
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".vercel.app") ||
    host === PRODUCTION_DOMAINS.staging
  );
}

function vercelPreviewBaseUrl(): string | null {
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (!vercelUrl) {
    return null;
  }
  const host = vercelUrl.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  if (!host) {
    return null;
  }
  return `https://${host}`;
}

/**
 * Resolve the public base URL Mollie should call for webhookUrl / redirectUrl.
 *
 * - Vercel preview → deployment URL (`VERCEL_URL`), never production NEXT_PUBLIC_APP_URL
 * - Local / development → localhost (or a non-production configured URL)
 * - Mollie TEST credentials → never production app host (falls back to preview/local)
 * - Production LIVE → `getAppUrl()` / NEXT_PUBLIC_APP_URL
 */
export function resolveMollieCallbackBaseUrl(): string {
  const vercelEnv = process.env.VERCEL_ENV?.trim();
  const credentialMode = getMollieCredentialMode();
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";

  if (vercelEnv === "preview") {
    const preview = vercelPreviewBaseUrl();
    if (preview) {
      return stripTrailingSlash(preview);
    }
    if (configured && isSafeNonProductionHost(configured)) {
      return stripTrailingSlash(configured);
    }
    return "http://localhost:3000";
  }

  if (vercelEnv === "development" || process.env.NODE_ENV !== "production") {
    if (configured && isSafeNonProductionHost(configured)) {
      return stripTrailingSlash(configured);
    }
    return "http://localhost:3000";
  }

  // Production runtime (Vercel production or NODE_ENV=production without preview).
  const productionBase = stripTrailingSlash(configured || getAppUrl());

  // TEST-mode payments must never receive the production webhook/return host.
  if (credentialMode === "test" && isProductionAppHost(productionBase)) {
    const preview = vercelPreviewBaseUrl();
    if (preview) {
      return stripTrailingSlash(preview);
    }
    if (configured && isSafeNonProductionHost(configured)) {
      return stripTrailingSlash(configured);
    }
    return "http://localhost:3000";
  }

  return productionBase;
}

export function buildMollieWebhookUrl(): string {
  return `${resolveMollieCallbackBaseUrl()}/api/mollie/webhook`;
}

export function buildMollieProductionReturnUrl(checkoutAttemptId: string): string {
  return `${resolveMollieCallbackBaseUrl()}/settings/billing/mollie/return?attempt=${encodeURIComponent(checkoutAttemptId)}`;
}

export function buildMollieTestReturnUrl(checkoutAttemptId: string): string {
  return `${resolveMollieCallbackBaseUrl()}/settings/billing/mollie-test/return?attempt=${encodeURIComponent(checkoutAttemptId)}`;
}

export function buildMollieUpgradeReturnUrl(attemptId: string): string {
  return `${resolveMollieCallbackBaseUrl()}/settings/billing/mollie/return?attempt=${encodeURIComponent(attemptId)}&purpose=upgrade`;
}
