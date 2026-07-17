"use client";

import Link from "next/link";
import { AuthAwareMarketingLink } from "@/components/marketing/auth-aware-marketing-link";
import { useMarketingAuth } from "@/components/marketing/marketing-auth-provider";
import { MARKETING_ROUTES } from "@/lib/company/contact";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

type MarketingPlanCtaProps = {
  planName: string;
  className?: string;
};

/**
 * Public pricing CTAs preserve the Paddle review path:
 * logged out → /signup → auth → /settings/plans
 * logged in → /settings/plans (real checkout location)
 * Enterprise → contact sales
 */
export function MarketingPlanCta({ planName, className }: MarketingPlanCtaProps) {
  const auth = useMarketingAuth();
  const isEnterprise = planName === "Enterprise";
  const buttonClass = cn(
    "mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground",
    focusRing,
    className,
  );

  if (isEnterprise) {
    return (
      <AuthAwareMarketingLink
        href={MARKETING_ROUTES.contact}
        contactIntent="enterprise"
        className={buttonClass}
      >
        Contact sales
      </AuthAwareMarketingLink>
    );
  }

  if (auth.isAuthenticated) {
    return (
      <Link href="/settings/plans" className={buttonClass}>
        Choose plan
      </Link>
    );
  }

  return (
    <Link href="/signup" className={buttonClass}>
      Create workspace
    </Link>
  );
}
