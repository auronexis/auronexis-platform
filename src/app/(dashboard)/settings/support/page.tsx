import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, Mail, MessageSquare, Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsNavCard } from "@/components/settings/settings-nav-card";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import {
  HELP_LINKS,
  SALES_EMAIL,
  SECURITY_EMAIL,
  SUPPORT_EMAIL,
} from "@/lib/company/contact";

export const metadata: Metadata = {
  title: "Support",
};

export default async function SettingsSupportPage() {
  await requireModuleAccess("settings");

  return (
    <>
      <PageHeader
        module="settings"
        title="Support"
        description="Contact channels for product help, sales, and security."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsNavCard
          href={`mailto:${SUPPORT_EMAIL}`}
          title="Product support"
          description={`Email ${SUPPORT_EMAIL} for workspace help and pilot assistance.`}
          icon={LifeBuoy}
        />
        <SettingsNavCard
          href={`mailto:${SALES_EMAIL}`}
          title="Sales"
          description={`Contact ${SALES_EMAIL} for plans, pilots, and partnerships.`}
          icon={Mail}
        />
        <SettingsNavCard
          href={`mailto:${SECURITY_EMAIL}`}
          title="Security"
          description={`Report vulnerabilities to ${SECURITY_EMAIL}.`}
          icon={Shield}
        />
        <SettingsNavCard
          href="/settings/enterprise"
          title="Enterprise request"
          description="Review Enterprise plan status or submit a workspace request."
          icon={MessageSquare}
        />
        <SettingsNavCard
          href={HELP_LINKS.feedback}
          title="Feedback"
          description="Share product feedback with our team."
          icon={MessageSquare}
        />
      </div>

      <div className="mt-8 rounded-xl border border-border/70 bg-surface/40 p-5 text-sm text-muted">
        <p className="font-medium text-foreground">Self-service resources</p>
        <ul className="mt-3 space-y-2">
          <li>
            <Link href="/docs" className="text-primary hover:underline">
              Documentation hub
            </Link>
          </li>
          <li>
            <Link href="/status" className="text-primary hover:underline">
              System status
            </Link>
          </li>
          <li>
            <Link href="/settings/diagnostics" className="text-primary hover:underline">
              Workspace diagnostics
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}
