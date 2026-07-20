import type { AnalyticsEventProps } from "@/lib/analytics/events";

type ClarityCommand = (command: string, ...args: unknown[]) => void;

function getClarity(): ClarityCommand | null {
  if (typeof window === "undefined") return null;
  const clarity = (window as Window & { clarity?: ClarityCommand }).clarity;
  return typeof clarity === "function" ? clarity : null;
}

/** Forward sanitized custom events to Microsoft Clarity — event name only. */
export function claritySink(name: string, _props?: AnalyticsEventProps): void {
  void _props;
  const clarity = getClarity();
  if (!clarity) return;

  try {
    clarity("event", name);
  } catch {
    // Clarity must never break the app.
  }
}
