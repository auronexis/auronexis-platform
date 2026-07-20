"use client";

import { RouteErrorBoundary, type AppRouterErrorProps } from "@/components/errors/route-error-boundary";

export default function GlobalError({ error, reset }: AppRouterErrorProps) {
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
