"use client";

import { RouteErrorBoundary, type AppRouterErrorProps } from "@/components/errors/route-error-boundary";

export default function MarketingError({ error, reset }: AppRouterErrorProps) {
  return (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      scope="marketing"
      homeHref="/"
      homeLabel="Back home"
      secondaryHref="/contact"
      secondaryLabel="Contact support"
    />
  );
}
