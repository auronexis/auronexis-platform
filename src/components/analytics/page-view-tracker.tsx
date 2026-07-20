"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import { resolvePageViewSurface } from "@/lib/analytics/surfaces";

/** Fires page_view events on route changes — respects consent via trackAnalyticsEvent. */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const surface = resolvePageViewSurface(pathname);
    trackAnalyticsEvent("page_view", { path: pathname, surface });
    if (pathname === "/") {
      trackAnalyticsEvent("landing_page_view", { path: pathname, surface: "homepage" });
    }
  }, [pathname]);

  return null;
}
