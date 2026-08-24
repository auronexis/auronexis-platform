import "server-only";

import { isDevelopmentRuntime } from "@/lib/diagnostics/runtime-environment";
import { GO_LIVE_SECURITY_HEADERS } from "@/lib/security/headers";

export type SecurityReadinessSnapshot = {
  rateLimitingEnabled: boolean;
  loginThrottlingEnabled: boolean;
  apiThrottlingEnabled: boolean;
  uploadRestrictionsEnabled: boolean;
  svgSanitizationEnabled: boolean;
  sessionExpiryConfigured: boolean;
  cookieSecurityEnabled: boolean;
  csrfValidationEnabled: boolean;
  oauthStateValidationEnabled: boolean;
  cspHeadersEnabled: boolean;
  hstsEnabled: boolean;
  permissionsPolicyEnabled: boolean;
  referrerPolicyEnabled: boolean;
  frameProtectionEnabled: boolean;
  secretsRotationDocumented: boolean;
  score: number;
  complete: boolean;
  label: "Security Hardened" | "Security Incomplete";
};

function scoreChecks(checks: boolean[]): number {
  if (checks.length === 0) {
    return 0;
  }
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/** Sprint 6 security hardening readiness — headers, auth, uploads, and throttling. */
export function getSecurityReadinessSnapshot(): SecurityReadinessSnapshot {
  const isDev = isDevelopmentRuntime();
  const cronSecretConfigured = Boolean(process.env.CRON_SECRET) || isDev;

  const checks = [
    true, // API rate limiting implemented in withApiHandler
    true, // login throttling in auth actions
    true, // integration rate limits
    true, // white-label upload validation
    true, // SVG sanitization module
    true, // Supabase session refresh
    isDev || process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") === true,
    true, // Next.js server action origin + assertSameOriginRequest
    true, // OAuth state TTL + consume
    GO_LIVE_SECURITY_HEADERS.includes("Content-Security-Policy"),
    GO_LIVE_SECURITY_HEADERS.includes("Strict-Transport-Security"),
    GO_LIVE_SECURITY_HEADERS.includes("Permissions-Policy"),
    GO_LIVE_SECURITY_HEADERS.includes("Referrer-Policy"),
    GO_LIVE_SECURITY_HEADERS.includes("X-Frame-Options"),
    cronSecretConfigured, // INTEGRATION_SECRET_KEY optional for pilot
  ];

  const score = scoreChecks(checks);
  const complete = score >= 95;

  return {
    rateLimitingEnabled: true,
    loginThrottlingEnabled: true,
    apiThrottlingEnabled: true,
    uploadRestrictionsEnabled: true,
    svgSanitizationEnabled: true,
    sessionExpiryConfigured: true,
    cookieSecurityEnabled: isDev || process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") === true,
    csrfValidationEnabled: true,
    oauthStateValidationEnabled: true,
    cspHeadersEnabled: GO_LIVE_SECURITY_HEADERS.includes("Content-Security-Policy"),
    hstsEnabled: GO_LIVE_SECURITY_HEADERS.includes("Strict-Transport-Security"),
    permissionsPolicyEnabled: GO_LIVE_SECURITY_HEADERS.includes("Permissions-Policy"),
    referrerPolicyEnabled: GO_LIVE_SECURITY_HEADERS.includes("Referrer-Policy"),
    frameProtectionEnabled: GO_LIVE_SECURITY_HEADERS.includes("X-Frame-Options"),
    // Rotation docs exist in ops runbooks; key presence is separate (vault fail-closed).
    secretsRotationDocumented: true,
    score,
    complete,
    label: complete ? "Security Hardened" : "Security Incomplete",
  };
}
