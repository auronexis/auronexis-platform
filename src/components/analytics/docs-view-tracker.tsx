"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackAnalyticsEvent } from "@/lib/analytics/events";

type DocsViewTrackerProps = {
  slug?: string;
};

/** Documentation page view analytics. */
export function DocsViewTracker({ slug }: DocsViewTrackerProps) {
  const pathname = usePathname();

  useEffect(() => {
    trackAnalyticsEvent("documentation_viewed", {
      surface: "docs",
      path: pathname,
      doc_slug: slug ?? "hub",
    });
  }, [pathname, slug]);

  return null;
}
