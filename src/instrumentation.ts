import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { suppressKnownNodeWarnings } = await import("@/lib/observability/suppress-known-warnings");
    suppressKnownNodeWarnings();
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.server.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
