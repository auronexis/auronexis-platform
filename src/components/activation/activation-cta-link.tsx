"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import type { AnalyticsEventName } from "@/lib/analytics/events";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import { cn } from "@/lib/utils/cn";
import { focusRing, pressable, transitionInteractive } from "@/lib/ui/tokens";
import type { ButtonSize, ButtonVariant } from "@/components/ui/button";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover hover:shadow-interactive active:shadow-sm",
  secondary:
    "border border-transparent bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary-hover hover:shadow-md active:shadow-sm",
  ghost:
    "border border-transparent bg-transparent text-foreground hover:bg-muted/10 hover:text-foreground active:bg-muted/15",
  outline:
    "border border-border bg-surface text-foreground shadow-xs hover:border-primary/30 hover:bg-primary/[0.04] hover:shadow-sm active:bg-primary/[0.06]",
  danger:
    "border border-transparent bg-danger text-danger-foreground shadow-xs hover:bg-danger-hover hover:shadow-md active:shadow-sm",
  success:
    "border border-transparent bg-success text-success-foreground shadow-xs hover:bg-success-hover hover:shadow-md active:shadow-sm",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-md px-3 text-xs",
  md: "h-10 gap-2 rounded-md px-4 text-sm",
  lg: "h-11 gap-2 rounded-lg px-5 text-sm",
};

type ActivationCtaLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  analyticsEvent?: AnalyticsEventName;
  analyticsProps?: Record<string, string | number | boolean>;
};

/** Analytics-aware CTA link for authenticated activation surfaces. */
export function ActivationCtaLink({
  className,
  variant = "primary",
  size = "md",
  analyticsEvent,
  analyticsProps,
  onClick,
  children,
  ...props
}: ActivationCtaLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center font-medium",
        transitionInteractive,
        focusRing,
        pressable,
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      onClick={(event) => {
        if (analyticsEvent) {
          trackAnalyticsEvent(analyticsEvent, analyticsProps);
        }
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
