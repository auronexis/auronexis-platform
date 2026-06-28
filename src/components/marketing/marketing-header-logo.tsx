import { AuroranexisWordmark } from "@/components/branding/auroranexis-wordmark";
import { cn } from "@/lib/utils/cn";

type MarketingHeaderLogoProps = {
  className?: string;
};

/** Marketing nav — CSS wordmark on dark header. */
export function MarketingHeaderLogo({ className }: MarketingHeaderLogoProps) {
  return (
    <AuroranexisWordmark
      variant="light"
      showMark={false}
      className={cn("shrink-0 text-[22px] font-semibold", className)}
    />
  );
}
