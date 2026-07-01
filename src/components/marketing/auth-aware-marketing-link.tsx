"use client";

import Link from "next/link";
import { resolveAuthenticatedMarketingLink } from "@/lib/marketing/auth-context";
import { useMarketingAuth } from "@/components/marketing/marketing-auth-provider";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

type AuthAwareMarketingLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
  contactIntent?: "enterprise" | "support";
};

/** Rewrites public contact/auth links for authenticated dashboard users. */
export function AuthAwareMarketingLink({
  href,
  className,
  children,
  contactIntent,
}: AuthAwareMarketingLinkProps) {
  const auth = useMarketingAuth();
  const resolvedHref = resolveAuthenticatedMarketingLink(href, auth, contactIntent);

  return (
    <Link href={resolvedHref} className={cn(className, focusRing, "rounded")}>
      {children}
    </Link>
  );
}
