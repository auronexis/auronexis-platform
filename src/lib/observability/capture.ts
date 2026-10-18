import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/observability/logger";

type CaptureContext = {
  tags?: Record<string, string>;
  [key: string]: unknown;
};

function getSentryDsn(): string | null {
  const value =
    process.env.SENTRY_DSN?.trim() ||
    process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() ||
    "";
  return value.length > 0 ? value : null;
}

function applyCaptureContext(scope: Sentry.Scope, context?: CaptureContext): void {
  if (!context) return;

  const { tags, ...extra } = context;
  if (tags) {
    for (const [key, value] of Object.entries(tags)) {
      if (typeof value === "string" && value.length > 0) {
        scope.setTag(key, value);
      }
    }
  }

  for (const [key, value] of Object.entries(extra)) {
    if (value === undefined) continue;
    // Avoid dumping nested objects that may contain PII; keep scalars only.
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      scope.setExtra(key, value);
    }
  }
}

function forwardExceptionToSentry(error: unknown, context?: CaptureContext): void {
  if (!getSentryDsn()) {
    return;
  }

  Sentry.withScope((scope) => {
    applyCaptureContext(scope, context);
    if (error instanceof Error) {
      Sentry.captureException(error);
      return;
    }
    Sentry.captureException(new Error(typeof error === "string" ? error : "Unknown error"));
  });
}

function forwardMessageToSentry(
  level: "warning" | "info",
  message: string,
  context?: CaptureContext,
): void {
  if (!getSentryDsn()) {
    return;
  }

  Sentry.withScope((scope) => {
    applyCaptureContext(scope, context);
    Sentry.captureMessage(message, level === "warning" ? "warning" : "info");
  });
}

export function captureException(error: unknown, context?: CaptureContext): void {
  const message = error instanceof Error ? error.message : "Unknown error";
  logger.error(message, { ...context, capture: "exception" });
  forwardExceptionToSentry(error, context);
}

export function captureWarning(message: string, context?: CaptureContext): void {
  logger.warn(message, { ...context, capture: "warning" });
  forwardMessageToSentry("warning", message, context);
}

export function captureInfo(message: string, context?: CaptureContext): void {
  logger.info(message, { ...context, capture: "info" });
  forwardMessageToSentry("info", message, context);
}
