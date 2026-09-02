"use client";

import { Suspense, useEffect } from "react";
import { ANALYTICS_CONFIG } from "@/lib/analytics/config";
import {
  ga4Sink,
  plausibleSink,
  posthogSink,
  registerAnalyticsSink,
  trackAnalyticsEvent,
  capturePostHogPageview,
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

function disablePostHog(): void {
  if (typeof window === "undefined") return;
  const posthog = (window as Window & { posthog?: { opt_out_capturing?: () => void; reset?: () => void } })
    .posthog;
  try {
    posthog?.opt_out_capturing?.();
    posthog?.reset?.();
  } catch {
    // Fail-silent — analytics must never break the app.
  }
  posthogInitialized = false;
}

function initPostHog(): void {
  if (!ANALYTICS_CONFIG.posthog.enabled) return;
  if (!hasAnalyticsConsent()) {
    disablePostHog();
    return;
  }
  if (posthogInitialized) return;

  const key = ANALYTICS_CONFIG.posthog.key;
  const host = ANALYTICS_CONFIG.posthog.host;
  const assetHost = ANALYTICS_CONFIG.posthog.assetHost;
  if (!key) return;

  void import("posthog-js").then(({ default: posthog }) => {
    // Guard against overlapping dynamic imports before the first init settles.
    if (posthogInitialized || !hasAnalyticsConsent()) return;

    posthog.init(key, {
      api_host: host,
      asset_host: assetHost,
      person_profiles: "identified_only",
      // Option B: manual App Router pageviews via PageViewTracker + posthogSink → $pageview.
      capture_pageview: false,
      capture_pageleave: true,
    });
    (window as Window & { posthog?: typeof posthog }).posthog = posthog;
    posthogInitialized = true;

    // PageViewTracker often runs before this async import resolves; capture the current URL once.
    capturePostHogPageview();
  });
}

function removeGa4Scripts(): void {
  document.getElementById("ga4-script")?.remove();
  document.getElementById("ga4-inline")?.remove();
  const win = window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
  if (win.dataLayer) {
    win.dataLayer.length = 0;
  }
  try {
    delete win.gtag;
  } catch {
    win.gtag = undefined;
  }
}

function initGa4(): void {
  if (!ANALYTICS_CONFIG.ga4.enabled) return;
  if (!hasMarketingConsent()) {
    removeGa4Scripts();
    return;
  }

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

/** Privacy-first analytics orchestration — scripts load only after consent; tear down on withdraw. */
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
