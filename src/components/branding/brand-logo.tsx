import type { ResolvedOrganizationBranding } from "@/lib/branding/defaults";
import { PLATFORM_NAME } from "@/lib/branding/defaults";
import { AuroranexisWordmark } from "@/components/branding/auroranexis-wordmark";
import { cn } from "@/lib/utils/cn";

type BrandLogoProps = {
  branding: Pick<ResolvedOrganizationBranding, "companyName">;
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "light" | "dark";
  layout?: "mark" | "horizontal";
};

const orgTextSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

function resolveWordmarkVariant(
  variant: BrandLogoProps["variant"],
  layout: BrandLogoProps["layout"],
): "dark" | "light" | "compact" {
  if (layout === "mark" && variant === "light") {
    return "compact";
  }
  return variant === "light" ? "light" : "dark";
}

/** Organization branding — CSS wordmark only (no image logos in UI). */
export function BrandLogo({
  branding,
  size = "md",
  className,
  variant = "dark",
  layout = "mark",
}: BrandLogoProps) {
  if (branding.companyName === PLATFORM_NAME) {
    return (
      <AuroranexisWordmark
        variant={resolveWordmarkVariant(variant, layout)}
        showMark={layout === "mark"}
        className={cn(orgTextSizeClasses[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "shrink-0 font-semibold tracking-tight",
        variant === "light" ? "text-white" : "text-foreground",
        orgTextSizeClasses[size],
        className,
      )}
    >
      {branding.companyName}
    </span>
  );
}
