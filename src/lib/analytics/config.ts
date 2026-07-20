import { isProductionAnalyticsRuntime } from "@/lib/analytics/runtime";

function envEnabled(value: string | undefined): boolean {
  return isProductionAnalyticsRuntime() && Boolean(value?.trim());
}

/** Analytics provider configuration — production only, fail-silent when unset. */
export const ANALYTICS_CONFIG = {
  plausible: {
    domain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim() || null,
    scriptUrl:
      process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL?.trim() || "https://plausible.io/js/script.js",
    enabled: envEnabled(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN),
  },
  clarity: {
    projectId: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() || null,
    enabled: envEnabled(process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID),
  },
  ga4: {
    measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || null,
    enabled: envEnabled(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
  },
  posthog: {
    key: process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || null,
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com",
    enabled: envEnabled(process.env.NEXT_PUBLIC_POSTHOG_KEY),
  },
  /** Google Tag Manager — integration-ready stub; no hard-coded container load. */
  gtm: {
    containerId: process.env.NEXT_PUBLIC_GTM_CONTAINER_ID?.trim() || null,
    enabled: envEnabled(process.env.NEXT_PUBLIC_GTM_CONTAINER_ID),
  },
  /** Bing Webmaster verification is SEO metadata only; listed for BI readiness. */
  bingWebmaster: {
    verification: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim() || null,
    enabled: Boolean(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim()),
  },
} as const;

export type AnalyticsProviderKey = keyof typeof ANALYTICS_CONFIG;

export function isAnyAnalyticsConfigured(): boolean {
  return (
    ANALYTICS_CONFIG.plausible.enabled ||
    ANALYTICS_CONFIG.clarity.enabled ||
    ANALYTICS_CONFIG.ga4.enabled ||
    ANALYTICS_CONFIG.posthog.enabled
  );
}

export function isMarketingAnalyticsConfigured(): boolean {
  return ANALYTICS_CONFIG.ga4.enabled || ANALYTICS_CONFIG.gtm.enabled;
}
