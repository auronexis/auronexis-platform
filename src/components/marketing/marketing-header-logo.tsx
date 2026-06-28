import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { cn } from "@/lib/utils/cn";

type MarketingHeaderLogoProps = {
  className?: string;
};

/** Marketing nav — logo-horizontal-transparent.png on dark header. */
export function MarketingHeaderLogo({ className }: MarketingHeaderLogoProps) {
  return (
    <img
      src={BRANDING_ASSETS.logoHorizontalTransparent}
      alt="Auroranexis logo"
      className={cn("h-[44px] w-auto max-w-none shrink-0 object-contain object-left", className)}
    />
  );
}
