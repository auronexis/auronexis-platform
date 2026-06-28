import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

export const ROW_INTERACTIVE_ATTR = "data-row-interactive";

/** Marks nested links/buttons so row-level navigation ignores them. */
export const rowInteractiveClass = "relative z-10";

export function rowInteractiveProps(className?: string) {
  return {
    [ROW_INTERACTIVE_ATTR]: true,
    className: cn(rowInteractiveClass, className),
  } as const;
}

type LinkOverlayProps = {
  href: string;
  ariaLabel: string;
  className?: string;
};

/** Stretched link covering a relative parent — valid HTML when nested controls use z-10 + data-row-interactive. */
export function LinkOverlay({ href, ariaLabel, className }: LinkOverlayProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(
        "absolute inset-0 z-0 rounded-[inherit]",
        focusRing,
        "focus-visible:ring-inset",
        className,
      )}
    />
  );
}

type InteractiveSurfaceProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function InteractiveSurface({ className, children, ...props }: InteractiveSurfaceProps) {
  return (
    <div className={cn("relative", className)} {...props}>
      {children}
    </div>
  );
}

type ClickableCardProps = HTMLAttributes<HTMLDivElement> & {
  href: string;
  ariaLabel: string;
  children: ReactNode;
};

export function ClickableCard({ href, ariaLabel, className, children, ...props }: ClickableCardProps) {
  return (
    <InteractiveSurface className={className} {...props}>
      <LinkOverlay href={href} ariaLabel={ariaLabel} />
      <div className="relative z-10">{children}</div>
    </InteractiveSurface>
  );
}

type RowInteractiveLinkProps = ComponentProps<typeof Link>;

export function RowInteractiveLink({ className, ...props }: RowInteractiveLinkProps) {
  return <Link {...props} {...rowInteractiveProps(className)} />;
}
