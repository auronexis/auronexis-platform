"use client";

import { Suspense, useEffect } from "react";
import { ANALYTICS_CONFIG } from "@/lib/analytics/config";
import {
  ga4Sink,
  plausibleSink,
  posthogSink,
  registerAnalyticsSink,
  trackAnalyticsEvent,
} from "@/lib/analytics/events";
import { claritySink } from "@/lib/analytics/clarity-events";
import { hasAnalyticsConsent, hasMarketingConsent, subscribeToConsentChanges } from "@/lib/consent/storage";
import { PlausibleScript } from "@/components/analytics/plausible-script";
import { ClarityScript } from "@/components/analytics/clarity-script";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { AnalyticsEventFlusher } from "@/components/analytics/analytics-event-flusher";
import { IntegrationConnectionTracker } from "@/components/analytics/integration-connection-tracker";

let sinksRegistered = false;

function registerSinksOnce(): void {
  if (sinksRegistered) return;
  registerAnalyticsSink((name, props) => plausibleSink(name, props), "analytics");
  registerAnalyticsSink((name, props) => claritySink(name, props), "analytics");
  registerAnalyticsSink((name, props) => posthogSink(name, props), "analytics");
  registerAnalyticsSink((name, props) => ga4Sink(name, props), "marketing");
  sinksRegistered = true;
}

let posthogInitialized = false;

function initPostHog(): void {
  if (!ANALYTICS_CONFIG.posthog.enabled || !hasAnalyticsConsent() || posthogInitialized) return;

  const key = ANALYTICS_CONFIG.posthog.key;
  const host = ANALYTICS_CONFIG.posthog.host;
  if (!key) return;

  void import("posthog-js").then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: host,
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: true,
    });
    (window as Window & { posthog?: typeof posthog }).posthog = posthog;
    posthogInitialized = true;
  });
}

function initGa4(): void {
  if (!ANALYTICS_CONFIG.ga4.enabled || !hasMarketingConsent()) return;

  const measurementId = ANALYTICS_CONFIG.ga4.measurementId;
  if (!measurementId) return;
  if (document.getElementById("ga4-script")) return;

  const script = document.createElement("script");
  script.id = "ga4-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  const inline = document.createElement("script");
  inline.id = "ga4-inline";
  inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${measurementId}',{anonymize_ip:true,send_page_view:false});`;
  document.head.appendChild(inline);
}

function loadConfiguredAnalytics(): void {
  registerSinksOnce();
  initPostHog();
  initGa4();
}

type AnalyticsProviderProps = {
  children: React.ReactNode;
};

/** Privacy-first analytics orchestration — scripts load only after consent. */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useEffect(() => {
    loadConfiguredAnalytics();

    return subscribeToConsentChanges(() => {
      loadConfiguredAnalytics();
    });
  }, []);

  return (
    <>
      {children}
      <PlausibleScript />
      <ClarityScript />
      <PageViewTracker />
      <AnalyticsEventFlusher />
      <Suspense fallback={null}>
        <IntegrationConnectionTracker />
      </Suspense>
    </>
  );
}

/** Safe imperative event for client components. */
export { trackAnalyticsEvent };
