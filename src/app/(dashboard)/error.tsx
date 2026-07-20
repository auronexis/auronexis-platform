"use client";

import { RouteErrorBoundary, type AppRouterErrorProps } from "@/components/errors/route-error-boundary";

export default function DashboardError({ error, reset }: AppRouterErrorProps) {
  return (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      scope="dashboard"
      homeHref="/dashboard"
      homeLabel="Return to dashboard"
    />
  );
}
