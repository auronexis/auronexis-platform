import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

type SkipLinkProps = {
  href?: string;
  label?: string;
  className?: string;
};

/** Visually hidden until focused — skips repetitive chrome for keyboard users. */
export function SkipLink({
  href = "#main-content",
  label = "Skip to main content",
  className,
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:border focus:border-border focus:bg-surface-1 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground",
        focusRing,
        className,
      )}
    >
      {label}
    </a>
  );
}
