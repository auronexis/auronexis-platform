import { Suspense, type ReactNode } from "react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingAuthProvider } from "@/components/marketing/marketing-auth-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { getPublicNavState } from "@/lib/marketing/public-nav";
import { cn } from "@/lib/utils/cn";

type MarketingShellProps = {
  children: ReactNode;
  className?: string;
  hideHeader?: boolean;
};

function MarketingHeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-secondary/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="h-11 w-40 animate-pulse rounded-lg bg-white/10" aria-hidden />
        <div className="hidden items-center gap-2 lg:flex" aria-hidden>
          <div className="h-9 w-16 animate-pulse rounded-lg bg-white/10" />
          <div className="h-9 w-16 animate-pulse rounded-lg bg-white/10" />
          <div className="h-9 w-16 animate-pulse rounded-lg bg-white/10" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-white/10" aria-hidden />
      </div>
    </header>
  );
}

async function MarketingShellContent({
  children,
  className,
  hideHeader = false,
}: MarketingShellProps) {
  const auth = await getPublicNavState();

  return (
    <>
      {hideHeader ? null : <MarketingHeader auth={auth} />}
      <MarketingAuthProvider value={auth}>
        <main className={cn("flex-auto", className)}>{children}</main>
      </MarketingAuthProvider>
    </>
  );
}

function MarketingShellFallback({ hideHeader }: { hideHeader?: boolean }) {
  return (
    <>
      {hideHeader ? null : <MarketingHeaderSkeleton />}
      <main className="flex-auto min-h-[40vh]" aria-busy="true" />
    </>
  );
}

/**
 * Public page shell — footer is a sync sibling after main so React streaming
 * never inserts the site footer before long page content finishes.
 */
export function MarketingShell({ children, className, hideHeader = false }: MarketingShellProps) {
  return (
    <div className="marketing-theme flex min-h-screen flex-col bg-secondary text-primary-foreground">
      <Suspense fallback={<MarketingShellFallback hideHeader={hideHeader} />}>
        <MarketingShellContent className={className} hideHeader={hideHeader}>
          {children}
        </MarketingShellContent>
      </Suspense>
      <SiteFooter variant="marketing" />
    </div>
  );
}
