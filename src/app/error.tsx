"use client";

import { RouteErrorBoundary } from "@/components/errors/route-error-boundary";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
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
