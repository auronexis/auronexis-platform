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
  Plug,
  Scale,
  ShieldAlert,
  Stethoscope,
  Timer,
  Users,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { AccessDenied } from "@/components/authorization/access-denied";
import { sessionHasPermission } from "@/lib/authorization/guards";
import { SettingsNavCard } from "@/components/settings/settings-nav-card";
import { PageHeader } from "@/components/layout/page-header";
import { requireSession } from "@/lib/auth/session";
import { SETTINGS_NAV_DESTINATIONS } from "@/lib/layout/settings-nav-destinations";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export const metadata: Metadata = {
  title: "Settings",
};

const SETTINGS_ICONS: Record<string, LucideIcon> = {
  "/settings/organization": Building2,
  "/settings/branding": Palette,
  "/settings/email": Mail,
  "/settings/sla": Timer,
  "/settings/escalation": ShieldAlert,
  "/settings/billing": CreditCard,
  "/settings/usage": BarChart3,
  "/settings/team": Users,
  "/settings/support": LifeBuoy,
  "/settings/legal": Scale,
  "/settings/about": Info,
  "/settings/integrations": Plug,
  "/settings/enterprise": Sparkles,
  "/settings/api": KeyRound,
  "/settings/diagnostics": Stethoscope,
};

export default async function SettingsPage() {
  const session = await requireSession();

  if (!sessionHasPermission(session, "settings.read")) {
    return (
      <>
        <PageHeader
          module="settings"
          title="Workspace Settings"
          description="Organization profile, workspace members, billing, and platform configuration."
        />
        <AccessDenied />
      </>
    );
  }

  const showAdmin = canManageOrganizationSettings(session);
  const links = SETTINGS_NAV_DESTINATIONS.filter((item) => showAdmin || !item.adminOnly);

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
            icon={SETTINGS_ICONS[item.href] ?? Building2}
          />
        ))}
      </div>
    </>
  );
}
