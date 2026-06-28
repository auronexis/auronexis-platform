import Link from "next/link";
import { BrandLogo } from "@/components/branding/brand-logo";
import { getPlatformBrandingDefaults } from "@/lib/branding/platform-defaults";
import { MARKETING_NAV } from "@/lib/marketing/content";
import { MARKETING_ROUTES } from "@/lib/company/contact";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

type MarketingHeaderProps = {
  className?: string;
};

const branding = getPlatformBrandingDefaults();

export function MarketingHeader({ className }: MarketingHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-white/10 bg-secondary/95 backdrop-blur-sm",
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href={MARKETING_ROUTES.home} className={cn(focusRing, "flex shrink-0 items-center")}>
          <BrandLogo
            branding={branding}
            layout="horizontal"
            size="md"
            variant="light"
            className="h-9 w-auto sm:h-10 lg:h-11"
          />
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
          <Link
            href="/login"
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium text-primary-foreground/80 hover:text-white",
              focusRing,
            )}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className={cn(
              "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground",
              focusRing,
            )}
          >
            Start free trial
          </Link>
        </div>
      </div>
    </header>
  );
}
