import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { cn } from "@/lib/utils/cn";

type AvatarFallbackProps = {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

/** Profile avatar with platform fallback image when no user photo exists. */
export function AvatarFallback({ name, size = "md", className }: AvatarFallbackProps) {
  return (
    <img
      src={BRANDING_ASSETS.profileFallback}
      alt={`${name} avatar`}
      className={cn(
        "shrink-0 rounded-full border border-primary/20 object-cover shadow-sm",
        sizeClasses[size],
        className,
      )}
      width={size === "lg" ? 64 : size === "md" ? 48 : 32}
      height={size === "lg" ? 64 : size === "md" ? 48 : 32}
    />
  );
}
