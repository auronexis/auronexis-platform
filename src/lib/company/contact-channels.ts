import {
  COMPANY_CONTACT,
  INFO_EMAIL,
  LEGAL_EMAIL,
  PARTNERS_EMAIL,
  PRESS_EMAIL,
  PRIVACY_EMAIL,
  SALES_EMAIL,
  SECURITY_EMAIL,
  SUPPORT_EMAIL,
} from "@/lib/company/company-contact";

export type ContactChannelIcon =
  | "life-buoy"
  | "handshake"
  | "shield"
  | "scale"
  | "mail"
  | "lock"
  | "users"
  | "newspaper";

export type ContactChannelCategory = "active" | "future";

export type EnterpriseContactChannel = {
  id: string;
  icon: ContactChannelIcon;
  title: string;
  purpose: string;
  email: string;
  mailtoHref: string;
  responseExpectation?: string;
  category: ContactChannelCategory;
};

function contactChannel(input: {
  id: string;
  icon: ContactChannelIcon;
  title: string;
  purpose: string;
  email: string;
  responseExpectation?: string;
  category: ContactChannelCategory;
  mailtoSubject?: string;
}): EnterpriseContactChannel {
  const subject = input.mailtoSubject ? `?subject=${encodeURIComponent(input.mailtoSubject)}` : "";
  return {
    id: input.id,
    icon: input.icon,
    title: input.title,
    purpose: input.purpose,
    email: input.email,
    mailtoHref: `mailto:${input.email}${subject}`,
    responseExpectation: input.responseExpectation,
    category: input.category,
  };
}

/** Enterprise contact channels — single source of truth for public contact surfaces. */
export const ENTERPRISE_CONTACT_CHANNELS: readonly EnterpriseContactChannel[] = [
  contactChannel({
    id: "support",
    icon: "life-buoy",
    title: "Support",
    purpose: "Technical assistance and onboarding",
    email: SUPPORT_EMAIL,
    responseExpectation: "Usually replies within 1 business day.",
    category: "active",
  }),
  contactChannel({
    id: "sales",
    icon: "handshake",
    title: "Sales",
    purpose: "Enterprise plans, pilots and partnerships",
    email: SALES_EMAIL,
    responseExpectation: "Enterprise inquiries typically within 2 business days.",
    category: "active",
    mailtoSubject: "Enterprise plan inquiry",
  }),
  contactChannel({
    id: "security",
    icon: "shield",
    title: "Security",
    purpose: "Report vulnerabilities",
    email: SECURITY_EMAIL,
    category: "active",
    mailtoSubject: "Security report",
  }),
  contactChannel({
    id: "legal",
    icon: "scale",
    title: "Legal",
    purpose: "Legal requests and compliance",
    email: LEGAL_EMAIL,
    category: "active",
  }),
  contactChannel({
    id: "general",
    icon: "mail",
    title: "General",
    purpose: "General inquiries",
    email: INFO_EMAIL,
    category: "active",
  }),
  contactChannel({
    id: "privacy",
    icon: "lock",
    title: "Privacy",
    purpose: "GDPR and privacy requests",
    email: PRIVACY_EMAIL,
    category: "future",
  }),
  contactChannel({
    id: "partnerships",
    icon: "users",
    title: "Partnerships",
    purpose: "Technology and strategic partnerships",
    email: PARTNERS_EMAIL,
    category: "future",
  }),
  contactChannel({
    id: "press",
    icon: "newspaper",
    title: "Press",
    purpose: "Media requests",
    email: PRESS_EMAIL,
    category: "future",
  }),
] as const;

export const ACTIVE_ENTERPRISE_CONTACT_CHANNELS = ENTERPRISE_CONTACT_CHANNELS.filter(
  (channel) => channel.category === "active",
);

export const FUTURE_ENTERPRISE_CONTACT_CHANNELS = ENTERPRISE_CONTACT_CHANNELS.filter(
  (channel) => channel.category === "future",
);

/** Compact contact list for pages that show primary channels only. */
export const PRIMARY_CONTACT_EMAILS = ACTIVE_ENTERPRISE_CONTACT_CHANNELS.map((channel) => ({
  label: channel.title,
  email: channel.email,
  description: channel.purpose,
  mailtoHref: channel.mailtoHref,
}));

export { COMPANY_CONTACT };
