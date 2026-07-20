"use client";

import { RouteErrorBoundary, type AppRouterErrorProps } from "@/components/errors/route-error-boundary";

export default function Error({ error, reset }: AppRouterErrorProps) {
  return (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      scope="app-root"
      homeHref="/"
      homeLabel="Back home"
      secondaryHref="/dashboard"
      secondaryLabel="Dashboard"
    />
  );
}
