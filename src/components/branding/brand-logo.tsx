import type { ResolvedOrganizationBranding } from "@/lib/branding/defaults";
import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { cn } from "@/lib/utils/cn";

type BrandLogoProps = {
  branding: Pick<
    ResolvedOrganizationBranding,
    | "companyName"
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

/** Full horizontal lockup — preserve artwork proportions; avoid max-width clipping. */
const horizontalSizeClasses = {
  sm: "h-9 w-auto max-w-[min(100%,280px)]",
  md: "h-10 w-auto max-w-[min(100%,300px)]",
  lg: "h-11 w-auto max-w-[min(100%,320px)]",
};

/**
 * Never use generated SVG logos. Approved PNG composite only on dark surfaces;
 * transparent horizontal PNG on light surfaces. Do not use composite PNGs with
 * baked backgrounds on light UI — callers should use text-only instead.
 */
function resolveLogoSrc(
  branding: BrandLogoProps["branding"],
  layout: BrandLogoProps["layout"],
  variant: BrandLogoProps["variant"],
): string {
  if (layout === "horizontal") {
    if (variant === "light") {
      return branding.logoLightUrl ?? BRANDING_ASSETS.approvedCompositeLogo;
    }
    return (
      branding.logoHorizontalUrl ??
      BRANDING_ASSETS.logoHorizontalTransparent ??
      BRANDING_ASSETS.logoHorizontalOnLight
    );
  }

  if (branding.iconUrl) {
    return branding.iconUrl;
  }

  if (branding.logoUrl) {
    return branding.logoUrl;
  }

  return BRANDING_ASSETS.compositeIcon512;
}

/** Organization logo mark or horizontal wordmark with approved platform asset fallbacks. */
export function BrandLogo({
  branding,
  size = "md",
  className,
  variant = "dark",
  layout = "mark",
}: BrandLogoProps) {
  const src = resolveLogoSrc(branding, layout, variant);

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
