import type { AnalyticsEventName } from "@/lib/analytics/events";

/** Centralized marketing CTA variants — enterprise design system. */
export type MarketingCtaVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";

export type MarketingCtaSize = "sm" | "md" | "lg";

export type MarketingCtaPreset = {
  id: string;
  label: string;
  href: string;
  variant: MarketingCtaVariant;
  analyticsEvent?: AnalyticsEventName;
  analyticsProps?: Record<string, string>;
};

export const MARKETING_CTA_PRESETS = {
  startFreeTrial: {
    id: "create_workspace",
    label: "Create workspace",
    href: "/signup",
    variant: "primary",
    analyticsEvent: "signup_started",
    analyticsProps: { source: "cta" },
  },
  bookDemo: {
    id: "book_demo",
    label: "Book demo",
    href: "/contact",
    variant: "primary",
    analyticsEvent: "demo_requested",
    analyticsProps: { source: "cta" },
  },
  requestEnterpriseDemo: {
    id: "request_enterprise_demo",
    label: "Request enterprise demo",
    href: "/contact",
    variant: "primary",
    analyticsEvent: "demo_requested",
    analyticsProps: { source: "enterprise_cta" },
  },
  contactSales: {
    id: "contact_sales",
    label: "Contact sales",
    href: "/contact",
    variant: "outline",
    analyticsEvent: "contact_clicked",
    analyticsProps: { intent: "sales" },
  },
  seePricing: {
    id: "see_pricing",
    label: "See pricing",
    href: "/pricing",
    variant: "secondary",
    analyticsEvent: "pricing_viewed",
    analyticsProps: { source: "cta" },
  },
  learnMore: {
    id: "learn_more",
    label: "Learn more",
    href: "/features",
    variant: "ghost",
    analyticsEvent: "cta_clicked",
    analyticsProps: { intent: "learn_more" },
  },
} as const satisfies Record<string, MarketingCtaPreset>;

export type MarketingCtaPresetKey = keyof typeof MARKETING_CTA_PRESETS;
