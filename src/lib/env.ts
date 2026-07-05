/**
 * Application environment variables validated at runtime.
 * Server-only secrets must never be imported in client components.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Public Supabase URL — safe for client and server. */
export function getSupabaseUrl(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
}

/** Public Supabase anon key — safe for client with RLS. */
export function getSupabaseAnonKey(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/** Service role key — server-only; bypasses RLS. Use with extreme care. */
export function getSupabaseServiceRoleKey(): string {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}

/** Application base URL for auth redirects. */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Resend API key — server-only. */
export function getResendApiKey(): string {
  return requireEnv("RESEND_API_KEY");
}

/** Verified sender address for Resend — server-only. */
export function getResendFromEmail(): string {
  return requireEnv("RESEND_FROM_EMAIL");
}

/** Stripe secret key — server-only. */
export function getStripeSecretKey(): string {
  return requireEnv("STRIPE_SECRET_KEY");
}

/** Stripe webhook signing secret — server-only. */
export function getStripeWebhookSecret(): string {
  return requireEnv("STRIPE_WEBHOOK_SECRET").trim();
}

/** Stripe publishable key — safe for client checkout elements. */
export function getStripePublishableKey(): string {
  return requireEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
}

/** Cron bearer secret for /api/cron/run — server-only. */
export function getCronSecret(): string | null {
  const value = process.env.CRON_SECRET;
  return value && value.trim().length > 0 ? value.trim() : null;
}

/** Returns true when cron endpoint authorization matches configured secret. */
export function verifyCronAuthorization(request: Request): boolean {
  const secret = getCronSecret();
  if (!secret) {
    return process.env.NODE_ENV === "development";
  }
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return false;
  }
  return header.slice("Bearer ".length) === secret;
}

/** Legacy fallback Stripe price ID — server-only. */
export function getStripePriceIdFallback(): string | null {
  const value = process.env.STRIPE_PRICE_ID;
  return value && value.trim().length > 0 ? value.trim() : null;
}

/** @deprecated Use getPlanPriceId(planKey) from billing/plans.server instead. */
export function getStripePriceId(): string {
  const fallback = getStripePriceIdFallback();

  if (fallback) {
    return fallback;
  }

  throw new Error("Missing required environment variable: STRIPE_PRICE_ID");
}

/** Platform sales org for inbound lead routing — server-only. */
export function getPlatformSalesOrgId(): string | null {
  const value = process.env.PLATFORM_SALES_ORG_ID;
  return value && value.trim().length > 0 ? value.trim() : null;
}

/** Calendly discovery call booking URL — optional. */
export const CALENDLY_DISCOVERY_URL =
  process.env.CALENDLY_DISCOVERY_URL?.trim() || process.env.NEXT_PUBLIC_CALENDLY_DISCOVERY_URL?.trim() || null;

/** Google Calendar scheduling URL — optional. */
export const GOOGLE_CALENDAR_DISCOVERY_URL =
  process.env.GOOGLE_CALENDAR_DISCOVERY_URL?.trim() ||
  process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_DISCOVERY_URL?.trim() ||
  null;

/** Google Meet base URL for generated meeting links — optional. */
export const GOOGLE_MEET_BASE_URL =
  process.env.GOOGLE_MEET_BASE_URL?.trim() || process.env.NEXT_PUBLIC_GOOGLE_MEET_BASE_URL?.trim() || null;
