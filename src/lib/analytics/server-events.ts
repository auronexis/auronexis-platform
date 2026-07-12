import "server-only";

import type { AnalyticsEventProps } from "@/lib/analytics/events";
import { resolveCanonicalEventName } from "@/lib/analytics/taxonomy";

const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
const GA4_API_SECRET = process.env.GA4_API_SECRET?.trim();

function sanitizeServerProps(props?: AnalyticsEventProps): AnalyticsEventProps | undefined {
  if (!props) return undefined;

  const blocked = /email|name|phone|address|password|token|secret|workspace|organization|client|stripe|api_key|customer/i;
  const safe: AnalyticsEventProps = {};

  for (const [key, value] of Object.entries(props)) {
    if (blocked.test(key)) continue;
    if (typeof value === "string" && (value.includes("@") || value.length > 120)) continue;
    safe[key] = value;
  }

  return Object.keys(safe).length > 0 ? safe : undefined;
}

/** Fire a server-side conversion to GA4 Measurement Protocol — optional, fail-silent. */
export async function trackServerAnalyticsEvent(
  name: string,
  props?: AnalyticsEventProps,
): Promise<void> {
  if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) return;

  const canonicalName = resolveCanonicalEventName(name);
  const safeProps = sanitizeServerProps(props);
  const clientId = `server.${Date.now()}`;

  const payload = {
    client_id: clientId,
    events: [
      {
        name: canonicalName,
        params: {
          engagement_time_msec: "1",
          ...safeProps,
        },
      },
    ],
  };

  try {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );
  } catch {
    // Server analytics must never break webhooks or actions.
  }
}
