import "server-only";

/**
 * Canonical production-runtime detection for readiness/diagnostics.
 * Prefer Vercel scope when present; never treat preview as production.
 * NODE_ENV=production alone (local prod build / non-Vercel host) counts as production.
 */
export function isProductionRuntime(): boolean {
  const vercelEnv = process.env.VERCEL_ENV?.trim();
  if (vercelEnv === "production") {
    return true;
  }
  if (vercelEnv === "preview" || vercelEnv === "development") {
    return false;
  }
  return process.env.NODE_ENV === "production";
}

/** True when running a non-production, non-preview developer context. */
export function isDevelopmentRuntime(): boolean {
  if (process.env.VERCEL_ENV === "preview") {
    return false;
  }
  return !isProductionRuntime();
}

/** True when the process is hosted on Vercel (any scope). */
export function isVercelRuntime(): boolean {
  const vercel = process.env.VERCEL?.trim();
  return vercel === "1" || vercel === "true" || Boolean(process.env.VERCEL_ENV?.trim());
}

export type RuntimeEnvironmentScope = "production" | "preview" | "development";

export function resolveRuntimeEnvironmentScope(): RuntimeEnvironmentScope {
  const scope = process.env.VERCEL_ENV?.trim();
  if (scope === "production" || scope === "preview" || scope === "development") {
    return scope;
  }
  return isProductionRuntime() ? "production" : "development";
}
