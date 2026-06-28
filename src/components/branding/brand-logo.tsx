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
 * Official platform logo only — /branding/logo-horizontal.png.
 * Org white-label URLs override when set.
 */
function resolveLogoSrc(
  branding: BrandLogoProps["branding"],
  layout: BrandLogoProps["layout"],
): string {
  if (layout === "horizontal") {
    return (
      branding.logoHorizontalUrl ??
      branding.logoLightUrl ??
      branding.logoDarkUrl ??
      branding.logoUrl ??
      BRANDING_ASSETS.approvedCompositeLogo
    );
  }

  return branding.iconUrl ?? branding.logoUrl ?? BRANDING_ASSETS.approvedCompositeLogo;
}

/** Organization logo mark or horizontal wordmark with approved platform asset fallbacks. */
export function BrandLogo({
  branding,
  size = "md",
  className,
  variant: _variant = "dark",
  layout = "mark",
}: BrandLogoProps) {
  const src = resolveLogoSrc(branding, layout);

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
