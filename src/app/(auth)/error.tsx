"use client";

import { RouteErrorBoundary, type AppRouterErrorProps } from "@/components/errors/route-error-boundary";

export default function AuthError({ error, reset }: AppRouterErrorProps) {
  return (
    <RouteErrorBoundary
      error={error}
      reset={reset}
      scope="auth"
      description="Sign-in could not be completed. Try again or return home."
      homeHref="/login"
      homeLabel="Back to sign in"
      secondaryHref="/"
      secondaryLabel="Back home"
    />
  );
}
