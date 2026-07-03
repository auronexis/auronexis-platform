"use client";

import { RouteErrorBoundary } from "@/components/errors/route-error-boundary";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function MarketingError({ error, reset }: ErrorProps) {
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
