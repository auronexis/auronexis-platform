import { MARKETING_ROUTES, SECURITY_EMAIL } from "@/lib/company/contact";

export const SUPPORT_RESPONSE_EXPECTATIONS =
  "We aim to respond to product and billing requests within one business day (Mon–Fri). Enterprise inquiries typically within two business days.";

export const SUPPORT_SELF_SERVICE_LINKS = [
  {
    id: "docs",
    title: "Documentation",
    description: "Guides for clients, reports, risks, billing, and the Public API.",
    href: MARKETING_ROUTES.documentation,
    linkLabel: "Documentation hub",
  },
  {
    id: "status",
    title: "System status",
    description: "Live availability for platform, API, billing, AI, and automation services.",
    href: MARKETING_ROUTES.status,
    linkLabel: "View status page",
  },
] as const;

export const SUPPORT_SECURITY_EMAIL = SECURITY_EMAIL;
