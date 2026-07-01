import Link from "next/link";
import { MarketingHeaderLogo } from "@/components/marketing/marketing-header-logo";
import { MARKETING_NAV } from "@/lib/marketing/content";
import { MARKETING_ROUTES } from "@/lib/company/contact";
import {
  resolveMarketingHeaderActions,
  type MarketingAuthState,
} from "@/lib/marketing/auth-context";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

type MarketingHeaderProps = {
  className?: string;
  auth?: MarketingAuthState;
};

export function MarketingHeader({ className, auth = { isAuthenticated: false } }: MarketingHeaderProps) {
  const actions = resolveMarketingHeaderActions(auth);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-white/10 bg-secondary/95 backdrop-blur-sm",
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href={MARKETING_ROUTES.home} className={cn(focusRing, "flex shrink-0 items-center")}>
          <MarketingHeaderLogo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {MARKETING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-primary-foreground/80 hover:text-white",
                focusRing,
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {actions.isAuthenticated ? (
            <>
              {actions.workspaceName ? (
                <span className="hidden max-w-[180px] truncate text-sm text-primary-foreground/70 sm:inline">
                  {actions.workspaceName}
                </span>
              ) : null}
              <Link
                href={actions.dashboardHref}
                className={cn(
                  "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground",
                  focusRing,
                )}
              >
                {actions.dashboardLabel}
              </Link>
            </>
          ) : (
            <>
              <Link
                href={actions.signInHref}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-primary-foreground/80 hover:text-white",
                  focusRing,
                )}
              >
                {actions.signInLabel}
              </Link>
              <Link
                href={actions.signupHref}
                className={cn(
                  "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground",
                  focusRing,
                )}
              >
                {actions.signupLabel}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
