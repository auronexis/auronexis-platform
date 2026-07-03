"use client";

import { RouteErrorBoundary } from "@/components/errors/route-error-boundary";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: ErrorProps) {
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
