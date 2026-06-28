import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { auroraSurface } from "@/lib/ui/aurora";

type PageSurfaceProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  padding?: "none" | "md" | "lg";
};

const paddingStyles = {
  none: "",
  md: "p-6",
  lg: "p-8",
} as const;

/** Standard elevated content surface for forms, lists, and detail panels. */
export function PageSurface({
  children,
  className,
  padding = "md",
  ...props
}: PageSurfaceProps) {
  return (
    <div className={cn(auroraSurface, paddingStyles[padding], className)} {...props}>
      {children}
    </div>
  );
}

type PageSurfaceHeadingProps = {
  title: string;
  description?: string;
  className?: string;
};

export function PageSurfaceHeading({ title, description, className }: PageSurfaceHeadingProps) {
  return (
    <div className={cn("mb-4", className)}>
      <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
    </div>
  );
}
