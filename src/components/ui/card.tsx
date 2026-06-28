import type { HTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { auroraSurface, auroraSurfaceInteractive } from "@/lib/ui/aurora";
import { cardInteractive } from "@/lib/ui/motion";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

type CardPadding = "none" | "sm" | "md" | "lg";

const paddingStyles: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

type CardVariant = "default" | "interactive" | "elevated" | "aurora" | "glass";

const variantStyles: Record<CardVariant, string> = {
  default: auroraSurface,
  aurora: auroraSurface,
  glass: "rounded-2xl border border-border-subtle bg-surface-1/90 shadow-sm backdrop-blur-sm",
  interactive: [auroraSurfaceInteractive, cardInteractive, focusRing].join(" "),
  elevated:
    "rounded-2xl border border-border/80 bg-gradient-to-b from-surface via-surface to-primary/[0.02] shadow-md",
};

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  padding?: CardPadding;
};

export function Card({
  className,
  variant = "default",
  padding = "md",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        variantStyles[variant],
        paddingStyles[padding],
        variant === "interactive" ? null : transitionInteractive,
        className,
      )}
      {...props}
    />
  );
}

type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div className={cn("mb-4 flex flex-col gap-1", className)} {...props} />;
}

type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn("text-base font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return <p className={cn("text-sm text-muted", className)} {...props} />;
}

type CardContentProps = HTMLAttributes<HTMLDivElement>;

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn("", className)} {...props} />;
}

type CardFooterProps = HTMLAttributes<HTMLDivElement>;

export function CardFooter({ className, ...props }: CardFooterProps) {
  return <div className={cn("mt-6 flex items-center gap-3", className)} {...props} />;
}

type InteractiveCardLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

/** Card-styled navigation tile with consistent hover elevation. */
export function InteractiveCardLink({ href, className, children }: InteractiveCardLinkProps) {
  return (
    <Link
      href={href}
      className={cn("block", auroraSurfaceInteractive, cardInteractive, "p-6", className)}
    >
      {children}
    </Link>
  );
}

/** Table/list wrapper with card chrome and no inner padding. */
export function DataTableShell({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <Card padding="none" variant="aurora" className={cn("overflow-hidden", className)} {...props}>
      {children}
    </Card>
  );
}
