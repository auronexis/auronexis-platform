import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent, SENTRY_PRIVACY_INIT } from "@/lib/observability/sentry-scrub";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    enabled: Boolean(dsn),
    ...SENTRY_PRIVACY_INIT,
    beforeSend(event) {
      return scrubSentryEvent(event as unknown as Record<string, unknown>) as typeof event | null;
    },
  });
}
