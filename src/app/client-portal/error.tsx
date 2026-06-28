"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PortalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[client-portal]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
      <p className="text-sm text-muted">
        The client portal encountered an unexpected error. Try again or sign in again.
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-muted">Reference: {error.digest}</p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Link
          href="/client-portal/login"
          className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-muted/10"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
