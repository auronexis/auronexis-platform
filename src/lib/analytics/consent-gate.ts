/**
 * Consent-gated analytics architecture.
 *
 * Providers must never initialize before explicit user consent.
 * Essential cookies always allowed; analytics and marketing are opt-in.
 *
 * Flow:
 * 1. User visits public site — no analytics scripts load
 * 2. User accepts analytics (future banner) — Plausible + Clarity + PostHog init
 * 3. User accepts marketing — GA4 init
 * 4. trackAnalyticsEvent() checks consent category per event type
 *
 * Banner UI lives in components/consent/ — this module is the server-safe contract.
 */

import { hasAnalyticsConsent, hasMarketingConsent } from "@/lib/consent/storage";
import { isProductionAnalyticsRuntime } from "@/lib/analytics/runtime";

export type AnalyticsConsentCategory = "analytics" | "marketing";

export function canInitializeAnalyticsProviders(): boolean {
  return isProductionAnalyticsRuntime() && hasAnalyticsConsent();
}

export function canInitializeMarketingProviders(): boolean {
  return isProductionAnalyticsRuntime() && hasMarketingConsent();
}

export function canTrackEvent(category: AnalyticsConsentCategory): boolean {
  if (!isProductionAnalyticsRuntime()) return false;
  return category === "marketing" ? hasMarketingConsent() : hasAnalyticsConsent();
}
