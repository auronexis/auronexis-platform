import type { AnalyticsEventProps } from "@/lib/analytics/events";

const STORAGE_KEY = "auroranexis:pending_analytics";

type PendingAnalyticsEvent = {
  name: string;
  props?: AnalyticsEventProps;
};

function readQueue(): PendingAnalyticsEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingAnalyticsEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(events: PendingAnalyticsEvent[]): void {
  if (typeof window === "undefined") return;
  try {
    if (events.length === 0) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Storage may be unavailable — analytics must not break UX.
  }
}

/** Queue an analytics event to fire after the next navigation (e.g. server redirect). */
export function markPendingAnalyticsEvent(name: string, props?: AnalyticsEventProps): void {
  const queue = readQueue();
  queue.push({ name, props });
  writeQueue(queue);
}

/** Consume and clear all pending analytics events. */
export function consumePendingAnalyticsEvents(): PendingAnalyticsEvent[] {
  const queue = readQueue();
  writeQueue([]);
  return queue;
}
