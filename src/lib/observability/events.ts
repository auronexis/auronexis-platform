import { captureInfo } from "@/lib/observability/capture";

type EventProperties = Record<string, string | number | boolean | null | undefined>;

/** Track a product or operational event — safe no-op metadata only. */
export function trackEvent(name: string, properties?: EventProperties): void {
  captureInfo(`event:${name}`, properties);
}
