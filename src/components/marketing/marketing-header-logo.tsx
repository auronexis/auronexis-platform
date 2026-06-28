"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

const MARKETING_LOGO_SRC = "/branding/logo-light.svg";

type MarketingHeaderLogoProps = {
  className?: string;
};

/** Production marketing nav logo — absolute public path only. */
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
      src={MARKETING_LOGO_SRC}
      alt="Auroranexis logo"
      className={cn(
        "shrink-0 object-contain object-left max-w-[min(100%,320px)]",
        className,
      )}
      onError={() => setFailed(true)}
    />
  );
}
