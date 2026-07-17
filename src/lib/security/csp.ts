/**
 * Single source of truth for Content-Security-Policy.
 * Used by middleware, next.config headers, and vercel.json (keep in sync).
 *
 * Paddle Billing domains (minimum required for Paddle.js overlay checkout):
 * - script-src / connect-src / frame-src: cdn.paddle.com, sandbox-cdn.paddle.com
 * - connect-src: api.paddle.com, sandbox-api.paddle.com
 * - frame-src: buy.paddle.com, sandbox-buy.paddle.com
 */
export function buildContentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    [
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "https://us.i.posthog.com",
      "https://us-assets.i.posthog.com",
      "https://eu.i.posthog.com",
      "https://plausible.io",
      "https://www.clarity.ms",
      "https://scripts.clarity.ms",
      "https://*.clarity.ms",
      "https://www.googletagmanager.com",
      "https://challenges.cloudflare.com",
      "https://cdn.paddle.com",
      "https://sandbox-cdn.paddle.com",
    ].join(" "),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    [
      "connect-src 'self'",
      "https://*.supabase.co",
      "wss://*.supabase.co",
      "https://api.stripe.com",
      "https://api.paddle.com",
      "https://sandbox-api.paddle.com",
      "https://cdn.paddle.com",
      "https://sandbox-cdn.paddle.com",
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
    [
      "frame-src",
      "https://challenges.cloudflare.com",
      "https://js.stripe.com",
      "https://hooks.stripe.com",
      "https://buy.paddle.com",
      "https://sandbox-buy.paddle.com",
      "https://cdn.paddle.com",
      "https://sandbox-cdn.paddle.com",
    ].join(" "),
  ].join("; ");
}
