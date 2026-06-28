import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { cn } from "@/lib/utils/cn";

type MarketingHeaderLogoProps = {
  className?: string;
};

/** Marketing nav — logo-horizontal.png on dark header. */
export function MarketingHeaderLogo({ className }: MarketingHeaderLogoProps) {
  return (
    <img
      src={BRANDING_ASSETS.logoHorizontal}
      alt="Auroranexis logo"
      className={cn("h-[32px] w-auto shrink-0 object-contain object-left sm:h-[36px]", className)}
    />
  );
}
