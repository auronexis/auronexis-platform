"use client";

import { useState } from "react";
import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { cn } from "@/lib/utils/cn";

type MarketingHeaderLogoProps = {
  className?: string;
};

/** Production marketing nav logo — transparent SVG for dark header. */
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
      src={BRANDING_ASSETS.uiLogoLight}
      alt="Auroranexis logo"
      className={cn(
        "shrink-0 object-contain object-left max-w-[min(100%,320px)]",
        className,
      )}
      onError={() => setFailed(true)}
    />
  );
}
