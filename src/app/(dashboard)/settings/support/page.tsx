import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CreditCard, LifeBuoy, Mail, MessageSquare, Shield, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsNavCard } from "@/components/settings/settings-nav-card";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import {
  HELP_LINKS,
  MARKETING_ROUTES,
  SALES_EMAIL,
  SECURITY_EMAIL,
  SUPPORT_EMAIL,
} from "@/lib/company/contact";
import { SUPPORT_RESPONSE_EXPECTATIONS } from "@/lib/support/content";

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
        description="Contact channels for product help, billing, Enterprise requests, and security."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsNavCard
          href={`mailto:${SUPPORT_EMAIL}`}
          title="Support email"
          description={`Email ${SUPPORT_EMAIL} for workspace help and onboarding.`}
          icon={LifeBuoy}
        />
        <SettingsNavCard
          href="/docs"
          title="Documentation"
          description="Guides for clients, reports, risks, billing, and the Public API."
          icon={BookOpen}
        />
        <SettingsNavCard
          href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Billing question")}`}
          title="Billing questions"
          description="Invoices, plan changes, and subscription status."
          icon={CreditCard}
        />
        <SettingsNavCard
          href="/settings/enterprise"
          title="Enterprise requests"
          description="Review Enterprise status or submit a workspace request."
          icon={Sparkles}
        />
        <SettingsNavCard
          href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent("Enterprise plan inquiry")}`}
          title="Contact sales"
          description={`Plans, pilots, and partnerships — ${SALES_EMAIL}.`}
          icon={Mail}
        />
        <SettingsNavCard
          href={`mailto:${SECURITY_EMAIL}`}
          title="Security"
          description={`Report vulnerabilities to ${SECURITY_EMAIL}.`}
          icon={Shield}
        />
        <SettingsNavCard
          href={HELP_LINKS.feedback}
          title="Product feedback"
          description="Share feedback with our product team."
          icon={MessageSquare}
        />
      </div>

      <div className="mt-8 space-y-6">
        <div className="rounded-xl border border-border/70 bg-surface/40 p-5 text-sm">
          <p className="font-medium text-foreground">Response expectations</p>
          <p className="mt-2 text-muted">{SUPPORT_RESPONSE_EXPECTATIONS}</p>
        </div>

        <div className="rounded-xl border border-border/70 bg-surface/40 p-5 text-sm text-muted">
          <p className="font-medium text-foreground">Self-service resources</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/docs" className="text-primary hover:underline">
                Documentation hub
              </Link>
            </li>
            <li>
              <Link href={MARKETING_ROUTES.support} className="text-primary hover:underline">
                Public support page
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
            <li>
              <Link href="/settings/billing" className="text-primary hover:underline">
                Subscription &amp; billing
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
