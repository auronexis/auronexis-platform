import { BRANDING_ASSETS } from "@/lib/branding/assets";

type MarketingHeaderLogoProps = {
  className?: string;
};

/** Marketing nav — logo-horizontal-transparent.png on dark header. */
export function MarketingHeaderLogo({ className }: MarketingHeaderLogoProps) {
  return (
    <img
      src={BRANDING_ASSETS.logoHorizontalTransparent}
      alt="Auroranexis logo"
      className={className ?? "h-[36px] w-auto object-contain sm:h-[42px]"}
    />
  );
}
