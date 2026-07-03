import { Suspense, type ReactNode } from "react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingAuthProvider } from "@/components/marketing/marketing-auth-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { getSession } from "@/lib/auth/session";
import { getMarketingAuthState } from "@/lib/marketing/auth-context";
import { cn } from "@/lib/utils/cn";

type MarketingShellProps = {
  children: ReactNode;
  className?: string;
  hideHeader?: boolean;
};

async function MarketingHeaderWithAuth() {
  const session = await getSession();
  const auth = getMarketingAuthState(session);
  return <MarketingHeader auth={auth} />;
}

async function MarketingAuthMain({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const session = await getSession();
  const auth = getMarketingAuthState(session);
  return (
    <MarketingAuthProvider value={auth}>
      <main className={cn("flex-auto", className)}>{children}</main>
    </MarketingAuthProvider>
  );
}

function MarketingAuthMainFallback({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <MarketingAuthProvider value={{ isAuthenticated: false }}>
      <main className={cn("flex-auto", className)}>{children}</main>
    </MarketingAuthProvider>
  );
}

/**
 * Public page shell — footer is a sync sibling after main so React streaming
 * never inserts the site footer before long page content finishes.
 */
export function MarketingShell({ children, className, hideHeader = false }: MarketingShellProps) {
  return (
    <div className="marketing-theme flex min-h-screen flex-col bg-secondary text-primary-foreground">
      {hideHeader ? null : (
        <Suspense fallback={<MarketingHeader />}>
          <MarketingHeaderWithAuth />
        </Suspense>
      )}
      <Suspense
        fallback={
          <MarketingAuthMainFallback className={className}>{children}</MarketingAuthMainFallback>
        }
      >
        <MarketingAuthMain className={className}>{children}</MarketingAuthMain>
      </Suspense>
      <SiteFooter variant="marketing" />
    </div>
  );
}
