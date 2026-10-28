import "server-only";

/** Pages slower than this log their phase timings to the runtime logs. */
export const SLOW_PAGE_THRESHOLD_MS = 1500;

/**
 * Minimal server-side phase timer. Logs one line (no user or organization data) when the
 * blocking part of a page render is slow, so slow phases show up in the Vercel runtime logs.
 */
export function startPhaseTimer(now: () => number = () => performance.now()) {
  const start = now();
  let last = start;
  const phases: Record<string, number> = {};

  return {
    mark(name: string) {
      const current = now();
      phases[name] = Math.round(current - last);
      last = current;
    },
    totalMs() {
      return Math.round(now() - start);
    },
    logIfSlow(route: string, thresholdMs = SLOW_PAGE_THRESHOLD_MS) {
      const total = Math.round(now() - start);
      if (total < thresholdMs) return false;
      console.info(`[slow-page] ${JSON.stringify({ route, totalMs: total, phases })}`);
      return true;
    },
  };
}
