"use client";

import { RouteErrorBoundary } from "@/components/errors/route-error-boundary";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PortalError({ error, reset }: ErrorProps) {
  return (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      scope="client-portal"
      description="The client portal encountered an unexpected error. Try again or return to sign in."
      homeHref="/client-portal/login"
      homeLabel="Back to sign in"
      secondaryHref="/"
      secondaryLabel="Back home"
    />
  );
}
