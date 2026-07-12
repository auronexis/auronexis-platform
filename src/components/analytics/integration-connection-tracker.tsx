"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackProductEvent } from "@/lib/analytics/events";

/** Integration OAuth callback analytics — provider id only, no workspace identifiers. */
export function IntegrationConnectionTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname.includes("/automation/connectors") && !pathname.includes("/settings/integrations")) {
      return;
    }

    const connected = searchParams.get("connected");
    if (!connected) return;

    const key = `auroranexis:integration_connected:${connected}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    trackProductEvent("integration_connected", {
      provider: connected,
      surface: pathname.includes("/settings/") ? "settings_integrations" : "automation_connectors",
    });
  }, [pathname, searchParams]);

  return null;
}
