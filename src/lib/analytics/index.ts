export { ANALYTICS_CONFIG, isAnyAnalyticsConfigured, isMarketingAnalyticsConfigured } from "@/lib/analytics/config";
export {
  canInitializeAnalyticsProviders,
  canInitializeMarketingProviders,
  canTrackEvent,
} from "@/lib/analytics/consent-gate";
export { claritySink } from "@/lib/analytics/clarity-events";
export { isProductionAnalyticsRuntime } from "@/lib/analytics/runtime";
export {
  ga4Sink,
  plausibleSink,
  posthogSink,
  registerAnalyticsSink,
  trackAnalyticsEvent,
  trackConversionEvent,
  trackProductEvent,
  type AnalyticsEventName,
  type AnalyticsEventProps,
  type AnalyticsSinkConsent,
} from "@/lib/analytics/events";

export {
  ANALYTICS_EVENT_CATEGORIES,
  CONVERSION_EVENTS,
  PRODUCT_EVENTS,
  ADOPTION_EVENTS,
  getEventCategory,
  resolveCanonicalEventName,
  isConversionEvent,
  isProductEvent,
} from "@/lib/analytics/taxonomy";

export {
  ANALYTICS_PROVIDERS,
  getConfiguredEventSinkProviders,
  type AnalyticsProviderDescriptor,
  type AnalyticsProviderId,
} from "@/lib/analytics/providers";

export {
  CONVERSION_FUNNEL_STAGES,
  EVENT_FUNNEL_STAGE,
  resolveFunnelStage,
  type ConversionFunnelStage,
} from "@/lib/analytics/funnel";

export {
  BUSINESS_EVENTS,
  PRODUCT_MODULES,
  type BusinessEventName,
  type ProductModule,
} from "@/lib/analytics/business-events";

export { trackAITelemetryEvent, type AITelemetryResult } from "@/lib/analytics/ai-telemetry";
export { resolvePageViewSurface } from "@/lib/analytics/surfaces";

export { markPendingAnalyticsEvent, consumePendingAnalyticsEvents } from "@/lib/analytics/pending-events";
export {
  trackFeatureAdoption,
  trackMonthlyActiveUsage,
  trackWeeklyActiveUsage,
  trackWorkspaceHealthViewed,
  trackExpansionSignal,
} from "@/lib/analytics/adoption-metrics";

export {
  acceptAllConsent,
  getConsentPreferences,
  hasAnalyticsConsent,
  hasConsentDecision,
  hasMarketingConsent,
  readConsent,
  rejectNonEssentialConsent,
  subscribeToConsentChanges,
  writeConsent,
} from "@/lib/consent/storage";

export {
  ALL_ACCEPTED_CONSENT,
  CONSENT_CHANGED_EVENT,
  CONSENT_STORAGE_KEY,
  DEFAULT_CONSENT,
  type ConsentCategory,
  type ConsentPreferences,
} from "@/lib/consent/types";
