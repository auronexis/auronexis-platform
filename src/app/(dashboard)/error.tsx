"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <PageHeader
        title="Something went wrong"
        description="An unexpected error occurred while loading this page. You can retry or return to the dashboard."
      />
      {error.digest ? (
        <p className="font-mono text-xs text-muted">Reference: {error.digest}</p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-muted/10"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
