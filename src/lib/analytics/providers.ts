/**
 * Modular analytics provider descriptors — enable/replace without business-logic changes.
 * Scripts initialize only after consent; sinks register with an explicit consent category.
 */

import type { AnalyticsConsentCategory } from "@/lib/analytics/consent-gate";
import { ANALYTICS_CONFIG } from "@/lib/analytics/config";

export type AnalyticsProviderId =
  | "plausible"
  | "clarity"
  | "posthog"
  | "ga4"
  | "gtm"
  | "bing_webmaster";

export type AnalyticsProviderDescriptor = {
  id: AnalyticsProviderId;
  /** Consent category required before init or capture. */
  consentCategory: AnalyticsConsentCategory;
  /** True when env is configured for production runtime. */
  configured: boolean;
  /** Optional — Search Console / Webmaster are verification-only, not event sinks. */
  kind: "event_sink" | "verification" | "tag_manager";
};

/** Catalog of supported providers — GTM/Bing are integration-ready stubs. */
export const ANALYTICS_PROVIDERS: readonly AnalyticsProviderDescriptor[] = [
  {
    id: "plausible",
    consentCategory: "analytics",
    configured: ANALYTICS_CONFIG.plausible.enabled,
    kind: "event_sink",
  },
  {
    id: "clarity",
    consentCategory: "analytics",
    configured: ANALYTICS_CONFIG.clarity.enabled,
    kind: "event_sink",
  },
  {
    id: "posthog",
    consentCategory: "analytics",
    configured: ANALYTICS_CONFIG.posthog.enabled,
    kind: "event_sink",
  },
  {
    id: "ga4",
    consentCategory: "marketing",
    configured: ANALYTICS_CONFIG.ga4.enabled,
    kind: "event_sink",
  },
  {
    id: "gtm",
    consentCategory: "marketing",
    configured: ANALYTICS_CONFIG.gtm.enabled,
    kind: "tag_manager",
  },
  {
    id: "bing_webmaster",
    consentCategory: "marketing",
    configured: ANALYTICS_CONFIG.bingWebmaster.enabled,
    kind: "verification",
  },
] as const;

export function getConfiguredEventSinkProviders(): AnalyticsProviderDescriptor[] {
  return ANALYTICS_PROVIDERS.filter((provider) => provider.kind === "event_sink" && provider.configured);
}
