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

const horizontalSizeClasses = {
  sm: "h-9 w-auto max-w-[min(100%,280px)]",
  md: "h-10 w-auto max-w-[min(100%,300px)]",
  lg: "h-11 w-auto max-w-[min(100%,320px)]",
};

function platformFallback(variant: BrandLogoProps["variant"]): string {
  return variant === "light"
    ? BRANDING_ASSETS.logoHorizontalTransparent
    : BRANDING_ASSETS.logoHorizontalOnLight;
}

function resolveLogoSrc(
  branding: BrandLogoProps["branding"],
  layout: BrandLogoProps["layout"],
  variant: BrandLogoProps["variant"],
): string {
  const onDarkSurface = variant === "light";

  if (layout === "horizontal") {
    if (onDarkSurface && branding.logoLightUrl) {
      return branding.logoLightUrl;
    }
    if (!onDarkSurface && branding.logoDarkUrl) {
      return branding.logoDarkUrl;
    }
    if (branding.logoHorizontalUrl) {
      return branding.logoHorizontalUrl;
    }
    if (branding.logoUrl) {
      return branding.logoUrl;
    }
    return platformFallback(variant);
  }

  if (branding.iconUrl) {
    return branding.iconUrl;
  }
  if (branding.logoUrl) {
    return branding.logoUrl;
  }
  if (onDarkSurface && branding.logoLightUrl) {
    return branding.logoLightUrl;
  }
  if (!onDarkSurface && branding.logoDarkUrl) {
    return branding.logoDarkUrl;
  }
  return platformFallback(variant);
}

/** Organization logo — transparent/on-light assets only in UI (no logo-horizontal.png). */
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
