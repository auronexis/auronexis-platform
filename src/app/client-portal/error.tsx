"use client";

import { RouteErrorBoundary, type AppRouterErrorProps } from "@/components/errors/route-error-boundary";

export default function PortalError({ error, reset }: AppRouterErrorProps) {
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
