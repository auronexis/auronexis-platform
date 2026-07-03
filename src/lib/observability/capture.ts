import { logger } from "@/lib/observability/logger";

type CaptureContext = Record<string, unknown>;

function getSentryDsn(): string | null {
  const value = process.env.SENTRY_DSN?.trim();
  return value && value.length > 0 ? value : null;
}

/** Optional future Sentry hook — no-op when SENTRY_DSN is unset. */
async function forwardToSentry(
  level: "error" | "warning" | "info",
  message: string,
  context?: CaptureContext,
): Promise<void> {
  if (!getSentryDsn()) {
    return;
  }

  // Reserved for Sentry SDK integration — safe no-op until configured.
  logger.debug("Sentry forwarding skipped (SDK not wired)", { level, message, context });
}

export function captureException(error: unknown, context?: CaptureContext): void {
  const message = error instanceof Error ? error.message : "Unknown error";
  logger.error(message, { ...context, capture: "exception" });
  void forwardToSentry("error", message, context);
}

export function captureWarning(message: string, context?: CaptureContext): void {
  logger.warn(message, { ...context, capture: "warning" });
  void forwardToSentry("warning", message, context);
}

export function captureInfo(message: string, context?: CaptureContext): void {
  logger.info(message, { ...context, capture: "info" });
  void forwardToSentry("info", message, context);
}
