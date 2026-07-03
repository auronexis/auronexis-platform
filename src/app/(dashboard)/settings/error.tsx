"use client";

import { RouteErrorBoundary } from "@/components/errors/route-error-boundary";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SettingsError({ error, reset }: ErrorProps) {
  return (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      scope="settings"
      description="Settings could not be loaded. Try again or return to your dashboard."
      homeHref="/dashboard"
      homeLabel="Return to dashboard"
      secondaryHref="/settings"
      secondaryLabel="Settings home"
    />
  );
}
