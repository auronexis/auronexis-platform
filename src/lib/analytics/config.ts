/** Analytics provider configuration — all optional, fail-silent when unset. */

export const ANALYTICS_CONFIG = {
  plausible: {
    domain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim() || null,
    scriptUrl:
      process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL?.trim() || "https://plausible.io/js/script.js",
    enabled: Boolean(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim()),
  },
  clarity: {
    projectId: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() || null,
    enabled: Boolean(process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim()),
  },
  ga4: {
    measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || null,
    enabled: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()),
  },
  posthog: {
    key: process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || null,
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com",
    enabled: Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()),
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
  return ANALYTICS_CONFIG.ga4.enabled;
}
