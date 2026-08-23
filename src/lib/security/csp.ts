/**
 * Single source of truth for Content-Security-Policy.
 * Used by middleware, next.config headers, and vercel.json (keep in sync).
 *
 * Mollie hosted checkout uses a full-page redirect (no embedded script/frame).
 * FastSpring Store Builder hosts were removed with the FastSpring retirement.
 */
export function buildContentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "upgrade-insecure-requests",
    [
      "script-src 'self' 'unsafe-inline'",
      "https://us.i.posthog.com",
      "https://us-assets.i.posthog.com",
      "https://eu.i.posthog.com",
      "https://plausible.io",
      "https://www.clarity.ms",
      "https://scripts.clarity.ms",
      "https://*.clarity.ms",
      "https://www.googletagmanager.com",
      "https://challenges.cloudflare.com",
    ].join(" "),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    [
      "connect-src 'self'",
      "https://*.supabase.co",
      "wss://*.supabase.co",
      "https://us.i.posthog.com",
      "https://eu.i.posthog.com",
      "https://*.sentry.io",
      "https://plausible.io",
      "https://www.clarity.ms",
      "https://*.clarity.ms",
      "https://c.bing.com",
      "https://region1.google-analytics.com",
      "https://www.google-analytics.com",
      "https://challenges.cloudflare.com",
    ].join(" "),
    "frame-src https://challenges.cloudflare.com",
  ].join("; ");
}
