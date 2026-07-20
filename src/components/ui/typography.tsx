import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type TypographyProps = HTMLAttributes<HTMLElement>;

export function PageTitle({ className, ...props }: TypographyProps) {
  return (
    <h1
      className={cn("text-2xl font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

export function PageDescription({ className, ...props }: TypographyProps) {
  return <p className={cn("mt-1 text-sm text-muted", className)} {...props} />;
}

export function SectionTitle({ className, ...props }: TypographyProps) {
  return (
    <h2
      className={cn("text-sm font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

export function CardHeading({ className, ...props }: TypographyProps) {
  return (
    <h3
      className={cn("text-base font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

export function MutedText({ className, ...props }: TypographyProps) {
  return <p className={cn("text-sm text-muted", className)} {...props} />;
}
