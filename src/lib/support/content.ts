import {
  MARKETING_ROUTES,
  SALES_EMAIL,
  SECURITY_EMAIL,
  SUPPORT_EMAIL,
} from "@/lib/company/contact";

export const SUPPORT_RESPONSE_EXPECTATIONS =
  "We aim to respond to product and billing requests within one business day (Mon–Fri). Enterprise inquiries typically within two business days.";

export const SUPPORT_CHANNELS = [
  {
    id: "email",
    title: "Support email",
    description: "Workspace help, onboarding questions, and account issues.",
    href: `mailto:${SUPPORT_EMAIL}`,
    linkLabel: SUPPORT_EMAIL,
  },
  {
    id: "docs",
    title: "Documentation",
    description: "Guides for clients, reports, risks, billing, and the Public API.",
    href: MARKETING_ROUTES.documentation,
    linkLabel: "Documentation hub",
  },
  {
    id: "billing",
    title: "Billing questions",
    description: "Invoices, plan changes, and subscription status.",
    href: `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Billing question")}`,
    linkLabel: "Email billing support",
  },
  {
    id: "enterprise",
    title: "Enterprise requests",
    description: "Custom limits, API access, onboarding, and security reviews.",
    href: `mailto:${SALES_EMAIL}?subject=${encodeURIComponent("Enterprise plan inquiry")}`,
    linkLabel: "Contact sales",
  },
] as const;

export const SUPPORT_SECURITY_NOTE = `Security vulnerabilities: ${SECURITY_EMAIL}`;
