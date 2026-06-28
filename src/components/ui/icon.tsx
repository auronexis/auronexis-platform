import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type IconSize = "sm" | "md" | "lg";

const sizeStyles: Record<IconSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

type IconProps = {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
  strokeWidth?: number;
};

/** Standardized Lucide icon wrapper — 16 / 20 / 24px with uniform stroke. */
export function Icon({ icon: IconComponent, size = "sm", className, strokeWidth = 1.75 }: IconProps) {
  return (
    <IconComponent
      className={cn("shrink-0", sizeStyles[size], className)}
      strokeWidth={strokeWidth}
      aria-hidden
    />
  );
}
