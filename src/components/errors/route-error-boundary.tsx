"use client";

import Link from "next/link";
import { useEffect } from "react";
import { captureException } from "@/lib/observability/capture";
import { SUPPORT_EMAIL } from "@/lib/company/contact";
import { Button } from "@/components/ui/button";

export type RouteErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  homeHref?: string;
  homeLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  scope?: string;
};

/** Shared prop contract for Next.js `error.tsx` / `global-error.tsx` route files. */
export type AppRouterErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function RouteErrorBoundary({
  error,
  reset,
  title = "Something went wrong",
  description = "An unexpected error occurred. You can try again or return to a safe page.",
  homeHref = "/dashboard",
  homeLabel = "Return to dashboard",
  secondaryHref,
  secondaryLabel,
  scope = "app",
}: RouteErrorBoundaryProps) {
  useEffect(() => {
    captureException(error, { scope, digest: error.digest });
  }, [error, error.digest, scope]);

  return (
    <div
      className="mx-auto flex max-w-lg flex-col gap-6 py-12"
      role="alert"
      aria-live="assertive"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted">{description}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={reset} aria-label="Try again">
          Try again
        </Button>
        <Link
          href={homeHref}
          className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          {homeLabel}
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link
            href={secondaryHref}
            className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>

      <p className="text-sm text-muted">
        Need help?{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          Contact support
        </a>
      </p>
    </div>
  );
}
