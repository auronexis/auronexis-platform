"use client";

import { useState } from "react";
import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { cn } from "@/lib/utils/cn";

type MarketingHeaderLogoProps = {
  className?: string;
};

/** Marketing nav — approved composite logo on dark header (32px height). */
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
      className={cn("shrink-0 object-contain object-left", className)}
      style={{ height: "32px", width: "auto" }}
      onError={() => setFailed(true)}
    />
  );
}
