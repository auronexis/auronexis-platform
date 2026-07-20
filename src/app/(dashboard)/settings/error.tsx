"use client";

import { RouteErrorBoundary, type AppRouterErrorProps } from "@/components/errors/route-error-boundary";

export default function SettingsError({ error, reset }: AppRouterErrorProps) {
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
