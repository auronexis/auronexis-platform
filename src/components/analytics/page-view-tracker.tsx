"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackAnalyticsEvent } from "@/lib/analytics/events";

/** Fires page_view events on route changes — respects consent via trackAnalyticsEvent. */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    trackAnalyticsEvent("page_view", { path: pathname });
  }, [pathname]);

  return null;
}
