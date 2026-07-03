import type { ReactNode } from "react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";

type DocsPageShellProps = {
  children: ReactNode;
};

/** Fully synchronous docs shell — no async session fetch or Suspense boundaries. */
export function DocsPageShell({ children }: DocsPageShellProps) {
  return (
    <div className="marketing-theme flex min-h-screen flex-col bg-secondary text-primary-foreground">
      <MarketingHeader />
      <main className="flex-auto">{children}</main>
      <SiteFooter variant="marketing" />
    </div>
  );
}
