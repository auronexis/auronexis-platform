import { isProductionAnalyticsRuntime } from "@/lib/analytics/runtime";

/** PostHog EU Cloud ingestion endpoints — https://posthog.com/docs/api */
export const POSTHOG_EU_API_HOST = "https://eu.i.posthog.com" as const;
export const POSTHOG_EU_ASSET_HOST = "https://eu-assets.i.posthog.com" as const;

function envEnabled(value: string | undefined): boolean {
  return isProductionAnalyticsRuntime() && Boolean(value?.trim());
}

function resolvePostHogAssetHost(apiHost: string): string {
  const normalized = apiHost.replace(/\/$/, "");
  if (normalized === POSTHOG_EU_API_HOST) {
    return POSTHOG_EU_ASSET_HOST;
  }

  const assetOverride = process.env.NEXT_PUBLIC_POSTHOG_ASSET_HOST?.trim();
  if (assetOverride) {
    return assetOverride;
  }

  return POSTHOG_EU_ASSET_HOST;
}

const posthogApiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || POSTHOG_EU_API_HOST;

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
    host: posthogApiHost,
    assetHost: resolvePostHogAssetHost(posthogApiHost),
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
