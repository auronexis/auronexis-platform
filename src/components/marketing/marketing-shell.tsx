import type { ReactNode } from "react";
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

export async function MarketingShell({ children, className, hideHeader = false }: MarketingShellProps) {
  const session = await getSession();
  const auth = getMarketingAuthState(session);

  return (
    <MarketingAuthProvider value={auth}>
      <div className="marketing-theme flex min-h-screen flex-col bg-secondary text-primary-foreground">
        {hideHeader ? null : <MarketingHeader auth={auth} />}
        <main className={cn("flex-1", className)}>{children}</main>
        <SiteFooter variant="marketing" />
      </div>
    </MarketingAuthProvider>
  );
}
