export { ANALYTICS_CONFIG, isAnyAnalyticsConfigured, isMarketingAnalyticsConfigured } from "@/lib/analytics/config";
export {
  ga4Sink,
  plausibleSink,
  posthogSink,
  registerAnalyticsSink,
  trackAnalyticsEvent,
  type AnalyticsEventName,
  type AnalyticsEventProps,
} from "@/lib/analytics/events";

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
