import type { ReactNode } from "react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils/cn";

type MarketingShellProps = {
  children: ReactNode;
  className?: string;
  hideHeader?: boolean;
};

export function MarketingShell({ children, className, hideHeader = false }: MarketingShellProps) {
  return (
    <div className="marketing-theme flex min-h-screen flex-col bg-secondary text-primary-foreground">
      {hideHeader ? null : <MarketingHeader />}
      <main className={cn("flex-1", className)}>{children}</main>
      <SiteFooter variant="marketing" />
    </div>
  );
}
