import { getAppUrl } from "@/lib/env";
import { resolveSafeRedirectPath } from "@/lib/auth/safe-redirect";

function appOrigin(): string {
  return getAppUrl().replace(/\/$/, "");
}

/**
 * Absolute URL for Supabase Auth email confirmation / OAuth return.
 * Always derived from NEXT_PUBLIC_APP_URL — never hardcode hosts.
 */
export function getAuthCallbackUrl(nextPath?: string): string {
  const base = `${appOrigin()}/auth/callback`;
  if (!nextPath) {
    return base;
  }
  const safe = resolveSafeRedirectPath(nextPath);
  return `${base}?next=${encodeURIComponent(safe)}`;
}

/** Absolute URL for password-reset email redirectTo. */
export function getPasswordResetRedirectUrl(): string {
  return `${appOrigin()}/reset-password`;
}
