import { hasAnalyticsConsent, hasMarketingConsent } from "@/lib/consent/storage";

/** Supported conversion and product analytics events. */
export type AnalyticsEventName =
  | "page_view"
  | "signup_started"
  | "signup_completed"
  | "login_completed"
  | "pricing_viewed"
  | "plan_selected"
  | "checkout_started"
  | "checkout_completed"
  | "billing_portal_opened"
  | "contact_clicked"
  | "support_clicked"
  | "demo_requested"
  | "docs_viewed"
  | "legal_page_viewed"
  | "client_created"
  | "report_created"
  | "risk_created"
  | "incident_created";

export type AnalyticsEventProps = Record<string, string | number | boolean>;

type AnalyticsSink = (name: AnalyticsEventName, props?: AnalyticsEventProps) => void;

const sinks: AnalyticsSink[] = [];

/** Register a runtime analytics sink (Plausible, PostHog, etc.). */
export function registerAnalyticsSink(sink: AnalyticsSink): void {
  sinks.push(sink);
}

function isMarketingEvent(name: AnalyticsEventName): boolean {
  return (
    name === "checkout_started" ||
    name === "checkout_completed" ||
    name === "plan_selected" ||
    name === "billing_portal_opened"
  );
}

/**
 * Track a privacy-aware analytics event.
 * Never sends personal data by default — only safe metadata props.
 */
export function trackAnalyticsEvent(
  name: AnalyticsEventName,
  props?: AnalyticsEventProps,
): void {
  if (typeof window === "undefined") return;

  if (isMarketingEvent(name)) {
    if (!hasMarketingConsent()) return;
  } else if (!hasAnalyticsConsent()) {
    return;
  }

  const safeProps = sanitizeEventProps(props);

  for (const sink of sinks) {
    try {
      sink(name, safeProps);
    } catch {
      // Analytics must never break the app.
    }
  }
}

const BLOCKED_PROP_KEYS = /email|name|phone|address|password|token|secret/i;

function sanitizeEventProps(props?: AnalyticsEventProps): AnalyticsEventProps | undefined {
  if (!props) return undefined;

  const safe: AnalyticsEventProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (BLOCKED_PROP_KEYS.test(key)) continue;
    if (typeof value === "string" && value.includes("@")) continue;
    safe[key] = value;
  }

  return Object.keys(safe).length > 0 ? safe : undefined;
}

/** Plausible-compatible custom event sink. */
export function plausibleSink(name: string, props?: AnalyticsEventProps): void {
  const plausible = (window as Window & { plausible?: (event: string, options?: { props?: AnalyticsEventProps }) => void }).plausible;
  if (!plausible) return;
  plausible(name, props ? { props } : undefined);
}

/** PostHog capture sink — only active when PostHog is initialized. */
export function posthogSink(name: string, props?: AnalyticsEventProps): void {
  const posthog = (window as Window & { posthog?: { capture: (event: string, props?: AnalyticsEventProps) => void } }).posthog;
  if (!posthog?.capture) return;
  posthog.capture(name, props);
}

/** GA4 gtag sink — only when marketing consent granted. */
export function ga4Sink(name: string, props?: AnalyticsEventProps): void {
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (!gtag) return;
  gtag("event", name, props);
}
