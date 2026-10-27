"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { capturePostHogPageview, trackAnalyticsEvent } from "@/lib/analytics/events";
import { hasAnalyticsConsent } from "@/lib/consent/storage";
import { resolvePageViewSurface } from "@/lib/analytics/surfaces";

/** Fires page_view on App Router pathname changes — PostHog receives `$pageview` via posthogSink (cookieless without consent). */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const surface = resolvePageViewSurface(pathname);
    if (!hasAnalyticsConsent()) {
      // No analytics consent: only an anonymous, cookieless PostHog page view (no other tools,
      // no custom events). PostHog is in cookieless mode in this case — see AnalyticsProvider.
      capturePostHogPageview();
      return;
    }
    trackAnalyticsEvent("page_view", { path: pathname, surface });
    if (pathname === "/") {
      trackAnalyticsEvent("landing_page_view", { path: pathname, surface: "homepage" });
    }
  }, [pathname]);

  return null;
}
