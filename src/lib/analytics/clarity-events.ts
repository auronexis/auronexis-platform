import type { AnalyticsEventProps } from "@/lib/analytics/events";

type ClarityCommand = (command: string, ...args: unknown[]) => void;

function getClarity(): ClarityCommand | null {
  if (typeof window === "undefined") return null;
  const clarity = (window as Window & { clarity?: ClarityCommand }).clarity;
  return typeof clarity === "function" ? clarity : null;
}

/** Forward sanitized custom events to Microsoft Clarity — session recordings + heatmaps. */
export function claritySink(name: string, props?: AnalyticsEventProps): void {
  const clarity = getClarity();
  if (!clarity) return;

  try {
    clarity("event", name);
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        clarity("set", key, String(value));
      }
    }
  } catch {
    // Clarity must never break the app.
  }
}
