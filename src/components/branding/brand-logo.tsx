import type { ResolvedOrganizationBranding } from "@/lib/branding/defaults";
import { getCompanyInitial } from "@/lib/branding/defaults";
import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { cn } from "@/lib/utils/cn";

type BrandLogoProps = {
  branding: Pick<
    ResolvedOrganizationBranding,
    | "companyName"
    | "primaryColor"
    | "logoUrl"
    | "logoLightUrl"
    | "logoDarkUrl"
    | "logoHorizontalUrl"
    | "iconUrl"
  >;
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "light" | "dark";
  layout?: "mark" | "horizontal";
};

const markSizeClasses = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-11 w-11",
};

const markFallbackClasses = {
  sm: "h-8 w-8 rounded-lg",
  md: "h-9 w-9 rounded-xl",
  lg: "h-11 w-11 rounded-xl",
};

/** Full horizontal lockup — preserve artwork proportions; avoid max-width clipping. */
const horizontalSizeClasses = {
  sm: "h-9 w-auto max-w-[min(100%,280px)]",
  md: "h-10 w-auto max-w-[min(100%,300px)]",
  lg: "h-11 w-auto max-w-[min(100%,320px)]",
};

function resolveLogoSrc(
  branding: BrandLogoProps["branding"],
  layout: BrandLogoProps["layout"],
  variant: BrandLogoProps["variant"],
): string {
  if (layout === "horizontal") {
    if (variant === "light") {
      return branding.logoLightUrl ?? BRANDING_ASSETS.logoLight;
    }
    return branding.logoHorizontalUrl ?? BRANDING_ASSETS.logoHorizontal;
  }

  if (branding.iconUrl) {
    return branding.iconUrl;
  }

  if (branding.logoUrl) {
    return branding.logoUrl;
  }

  return BRANDING_ASSETS.iconMark;
}

/** Organization logo mark or horizontal wordmark with platform asset fallbacks. */
export function BrandLogo({
  branding,
  size = "md",
  className,
  variant = "dark",
  layout = "mark",
}: BrandLogoProps) {
  const src = resolveLogoSrc(branding, layout, variant);

  if (src) {
    return (
      <img
        src={src}
        alt={`${branding.companyName} logo`}
        className={cn(
          "shrink-0 object-contain object-left",
          layout === "horizontal" ? horizontalSizeClasses[size] : markSizeClasses[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center text-sm font-bold tracking-tight text-white",
        markFallbackClasses[size],
        className,
      )}
      style={{ backgroundColor: branding.primaryColor }}
      aria-hidden
    >
      {getCompanyInitial(branding.companyName)}
    </div>
  );
}
