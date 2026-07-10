"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import type { MarketingCtaSize, MarketingCtaVariant } from "@/lib/marketing/cta";
import { trackAnalyticsEvent, type AnalyticsEventName } from "@/lib/analytics/events";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";
import { marketingCtaPress } from "@/lib/ui/marketing-motion";

const VARIANT_STYLES: Record<MarketingCtaVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover",
  secondary:
    "border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/15",
  ghost: "text-primary hover:bg-primary/10",
  outline:
    "border border-white/25 bg-transparent text-white hover:border-primary/40 hover:bg-white/5",
  danger:
    "border border-danger/30 bg-danger/10 text-danger hover:bg-danger/15",
};

const SIZE_STYLES: Record<MarketingCtaSize, string> = {
  sm: "px-3.5 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

type MarketingButtonBaseProps = {
  variant?: MarketingCtaVariant;
  size?: MarketingCtaSize;
  loading?: boolean;
  analyticsEvent?: AnalyticsEventName;
  analyticsProps?: Record<string, string | number | boolean>;
  ctaId?: string;
  className?: string;
  children: React.ReactNode;
};

type MarketingButtonAsButton = MarketingButtonBaseProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof MarketingButtonBaseProps> & {
    href?: undefined;
  };

type MarketingButtonAsLink = MarketingButtonBaseProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, keyof MarketingButtonBaseProps> & {
    href: string;
  };

export type MarketingButtonProps = MarketingButtonAsButton | MarketingButtonAsLink;

function trackCta(
  analyticsEvent: AnalyticsEventName | undefined,
  analyticsProps: Record<string, string | number | boolean> | undefined,
  ctaId: string | undefined,
): void {
  const event = analyticsEvent ?? "cta_clicked";
  trackAnalyticsEvent(event, {
    ...analyticsProps,
    ...(ctaId ? { cta_id: ctaId } : {}),
  });
}

/** Reusable enterprise CTA button — link or button with analytics and a11y. */
export function MarketingButton({
  variant = "primary",
  size = "md",
  loading = false,
  analyticsEvent,
  analyticsProps,
  ctaId,
  className,
  children,
  ...rest
}: MarketingButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-lg font-semibold",
    "disabled:pointer-events-none disabled:opacity-60",
    VARIANT_STYLES[variant],
    SIZE_STYLES[size],
    focusRing,
    marketingCtaPress,
    className,
  );

  if ("href" in rest && rest.href) {
    const { href, onClick, ...linkRest } = rest;
    return (
      <Link
        href={href}
        className={classes}
        aria-busy={loading || undefined}
        onClick={(event) => {
          trackCta(analyticsEvent, analyticsProps, ctaId);
          onClick?.(event);
        }}
        {...linkRest}
      >
        {loading ? "Loading…" : children}
      </Link>
    );
  }

  const { disabled, onClick, type = "button", ...buttonRest } = rest as MarketingButtonAsButton;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      onClick={(event) => {
        trackCta(analyticsEvent, analyticsProps, ctaId);
        onClick?.(event);
      }}
      {...buttonRest}
    >
      {loading ? "Loading…" : children}
    </button>
  );
}
