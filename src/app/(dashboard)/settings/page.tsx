import type { Metadata } from "next";
import {
  Building2,
  CreditCard,
  BarChart3,
  Info,
  KeyRound,
  LifeBuoy,
  Mail,
  Palette,
  Scale,
  ShieldAlert,
  Stethoscope,
  Timer,
  Users,
} from "lucide-react";
import { SettingsNavCard } from "@/components/settings/settings-nav-card";
import { PageHeader } from "@/components/layout/page-header";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export const metadata: Metadata = {
  title: "Settings",
};

const SETTINGS_LINKS = [
  {
    href: "/settings/organization",
    title: "Organization",
    description: "Update your agency name and workspace profile.",
    icon: Building2,
  },
  {
    href: "/settings/branding",
    title: "White Label Branding",
    description: "Rebrand dashboard, login, portal, emails, and PDF exports without code changes.",
    icon: Palette,
  },
  {
    href: "/settings/email",
    title: "Email delivery",
    description: "Configure sender name, from address, and reply-to for report emails.",
    icon: Mail,
  },
  {
    href: "/settings/sla",
    title: "SLA policies",
    description: "Define response-time targets for incidents and risks.",
    icon: Timer,
  },
  {
    href: "/settings/escalation",
    title: "Escalation rules",
    description: "Automate reactions to SLA breaches and critical operational events.",
    icon: ShieldAlert,
  },
  {
    href: "/settings/billing",
    title: "Subscription & Billing",
    description: "Manage plan, invoices, discounts, limits, and Stripe customer portal.",
    icon: CreditCard,
  },
  {
    href: "/settings/usage",
    title: "Usage",
    description: "Track AI, API, automation, storage, and team consumption against plan quotas.",
    icon: BarChart3,
  },
  {
    href: "/settings/team",
    title: "Workspace Members",
    description: "Manage members, roles, invitations, and access.",
    icon: Users,
  },
  {
    href: "/settings/support",
    title: "Support",
    description: "Contact support, sales, security, and share product feedback.",
    icon: LifeBuoy,
  },
  {
    href: "/settings/legal",
    title: "Legal",
    description: "Privacy policy, terms of service, imprint, and cookies.",
    icon: Scale,
  },
  {
    href: "/settings/about",
    title: "About",
    description: "Version, environment, pilot program, and product roadmap.",
    icon: Info,
  },
] as const;

const ADMIN_SETTINGS_LINKS = [
  {
    href: "/settings/api",
    title: "Public API",
    description: "Manage API keys, scopes, outbound webhooks, and view usage metrics.",
    icon: KeyRound,
  },
  {
    href: "/settings/diagnostics",
    title: "Diagnostics",
    description: "Inspect plan resolution, billing, AI readiness, and environment configuration.",
    icon: Stethoscope,
  },
] as const;

export default async function SettingsPage() {
  await requireModuleAccess("settings");
  const session = await requireSession();
  const showDiagnostics = canManageOrganizationSettings(session);
  const links = showDiagnostics ? [...SETTINGS_LINKS, ...ADMIN_SETTINGS_LINKS] : SETTINGS_LINKS;

  return (
    <>
      <PageHeader
        module="settings"
        title="Workspace Settings"
        description="Organization profile, workspace members, billing, and platform configuration."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((item) => (
          <SettingsNavCard
            key={item.href}
            href={item.href}
            title={item.title}
            description={item.description}
            icon={item.icon}
          />
        ))}
      </div>
    </>
  );
}
