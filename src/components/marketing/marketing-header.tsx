import Link from "next/link";
import { MarketingHeaderLogo } from "@/components/marketing/marketing-header-logo";
import {
  getPublicHeaderNavLinks,
  type MarketingAuthState,
} from "@/lib/marketing/auth-context";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

type MarketingHeaderProps = {
  className?: string;
  auth: MarketingAuthState;
};

const TEXT_LINK_CLASS =
  "rounded-lg px-3 py-2 text-sm font-medium text-primary-foreground/80 hover:text-white";

const PRIMARY_LINK_CLASS =
  "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground";

export function MarketingHeader({ className, auth }: MarketingHeaderProps) {
  const header = getPublicHeaderNavLinks(auth, "marketing");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-white/10 bg-secondary/95 backdrop-blur-sm",
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href={header.logoHref} className={cn(focusRing, "flex shrink-0 items-center")}>
          <MarketingHeaderLogo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {header.navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={cn(TEXT_LINK_CLASS, focusRing)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {header.workspaceName ? (
            <span className="hidden max-w-[180px] truncate text-sm text-primary-foreground/70 sm:inline">
              {header.workspaceName}
            </span>
          ) : null}
          {header.actionLinks.map((link) =>
            link.variant === "primary" ? (
              <Link key={link.href} href={link.href} className={cn(PRIMARY_LINK_CLASS, focusRing)}>
                {link.label}
              </Link>
            ) : (
              <Link key={link.href} href={link.href} className={cn(TEXT_LINK_CLASS, focusRing)}>
                {link.label}
              </Link>
            ),
          )}
        </div>
      </div>
    </header>
  );
}
