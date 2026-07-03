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

/** Sync shell — keeps main content and footer in one boundary to avoid streaming reorder. */
export function MarketingShell({ children, className, hideHeader = false }: MarketingShellProps) {
  return (
    <MarketingAuthProvider value={{ isAuthenticated: false }}>
      <div className="marketing-theme flex min-h-screen flex-col bg-secondary text-primary-foreground">
        {hideHeader ? null : (
          <Suspense fallback={<MarketingHeader />}>
            <MarketingHeaderWithAuth />
          </Suspense>
        )}
        <main className={cn("flex-auto", className)}>{children}</main>
        <SiteFooter variant="marketing" />
      </div>
    </MarketingAuthProvider>
  );
}
