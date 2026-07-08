"use client";

import { useEffect } from "react";
import { ANALYTICS_CONFIG } from "@/lib/analytics/config";
import { hasAnalyticsConsent, subscribeToConsentChanges } from "@/lib/consent/storage";

function injectClarity(): void {
  const projectId = ANALYTICS_CONFIG.clarity.projectId;
  if (!projectId || !hasAnalyticsConsent()) return;
  if (document.getElementById("clarity-script")) return;

  const inline = document.createElement("script");
  inline.id = "clarity-script";
  inline.textContent = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${projectId}");`;
  document.head.appendChild(inline);
}

/** Microsoft Clarity — loads only after analytics consent. */
export function ClarityScript() {
  useEffect(() => {
    if (!ANALYTICS_CONFIG.clarity.enabled) return;

    injectClarity();
    return subscribeToConsentChanges(() => injectClarity());
  }, []);

  return null;
}
