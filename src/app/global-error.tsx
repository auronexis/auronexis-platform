"use client";

import { RouteErrorBoundary } from "@/components/errors/route-error-boundary";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background px-6 font-sans text-foreground antialiased">
        <RouteErrorBoundary
          error={error}
          reset={reset}
          scope="global"
          homeHref="/"
          homeLabel="Back home"
          description="A critical error prevented this page from loading. Try again or return home."
        />
      </body>
    </html>
  );
}
