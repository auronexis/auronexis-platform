"use client";

import { useState } from "react";
import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { cn } from "@/lib/utils/cn";

type MarketingHeaderLogoProps = {
  className?: string;
};

/** Marketing nav — approved composite logo on dark header. */
export function MarketingHeaderLogo({ className }: MarketingHeaderLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={cn(
          "shrink-0 text-sm font-semibold tracking-tight text-white sm:text-base",
          className,
        )}
      >
        Auroranexis
      </span>
    );
  }

  return (
    <img
      src={BRANDING_ASSETS.approvedCompositeLogo}
      alt="Auroranexis logo"
      className={cn(
        "h-8 w-auto min-w-[110px] shrink-0 object-contain object-left sm:h-9 sm:min-w-[120px]",
        className,
      )}
      onError={() => setFailed(true)}
    />
  );
}
