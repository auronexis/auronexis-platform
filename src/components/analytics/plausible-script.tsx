"use client";

import { useEffect } from "react";
import { ANALYTICS_CONFIG } from "@/lib/analytics/config";
import { hasAnalyticsConsent, subscribeToConsentChanges } from "@/lib/consent/storage";

function removePlausible(): void {
  document.getElementById("plausible-script")?.remove();
}

function injectPlausible(): void {
  const { domain, scriptUrl } = ANALYTICS_CONFIG.plausible;
  if (!domain) return;
  if (!hasAnalyticsConsent()) {
    removePlausible();
    return;
  }
  if (document.getElementById("plausible-script")) return;

  const script = document.createElement("script");
  script.id = "plausible-script";
  script.defer = true;
  script.dataset.domain = domain;
  script.src = scriptUrl;
  document.head.appendChild(script);
}

/** Loads Plausible only after analytics consent — privacy-first, fail-silent; removes on withdraw. */
export function PlausibleScript() {
  useEffect(() => {
    if (!ANALYTICS_CONFIG.plausible.enabled) return;

    injectPlausible();
    return subscribeToConsentChanges(() => injectPlausible());
  }, []);

  return null;
}
