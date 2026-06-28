import { PLATFORM_NAME } from "@/lib/branding/defaults";
import { cn } from "@/lib/utils/cn";

type AuroranexisWordmarkProps = {
  variant?: "dark" | "light" | "compact";
  className?: string;
  showMark?: boolean;
  centered?: boolean;
};

function GradientMark({ compact }: { compact?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md font-bold leading-none",
        compact ? "h-5 w-5 text-[10px]" : "h-6 w-6 text-xs",
        "bg-gradient-to-br from-sky-400 via-violet-500 to-indigo-600 text-white shadow-sm",
      )}
    >
      A
    </span>
  );
}

const variantStyles = {
  dark: "text-slate-950",
  light: "text-white",
  compact: "text-sm font-semibold text-white",
} as const;

/** CSS-only Auroranexis wordmark — no image, SVG, or PNG. */
export function AuroranexisWordmark({
  variant = "dark",
  className,
  showMark = true,
  centered = false,
}: AuroranexisWordmarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-semibold tracking-tight",
        variantStyles[variant],
        centered && "justify-center",
        className,
      )}
    >
      {showMark ? <GradientMark compact={variant === "compact"} /> : null}
      <span>{PLATFORM_NAME}</span>
    </span>
  );
}
