import type { Metadata } from "next";
import { FileText, Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsNavCard } from "@/components/settings/settings-nav-card";
import { requireSession } from "@/lib/auth/session";
import { LEGAL_ROUTES } from "@/lib/company/contact";
import { LEGAL_PAGES } from "@/lib/company/legal-content";

export const metadata: Metadata = {
  title: "Legal",
};

const LEGAL_HUB = [
  { href: LEGAL_ROUTES.imprint, title: "Imprint", description: LEGAL_PAGES.imprint.description, icon: FileText },
  { href: LEGAL_ROUTES.privacy, title: "Privacy Policy", description: LEGAL_PAGES.privacy.description, icon: Shield },
  { href: LEGAL_ROUTES.terms, title: "Terms of Service", description: LEGAL_PAGES.terms.description, icon: FileText },
  { href: LEGAL_ROUTES.cookies, title: "Cookie Policy", description: LEGAL_PAGES.cookies.description, icon: Shield },
] as const;

export default async function DashboardLegalPage() {
  await requireSession();

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        module="settings"
        title="Legal"
        description="Privacy, terms, and compliance information for your workspace."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {LEGAL_HUB.map((item) => (
          <SettingsNavCard key={item.href} {...item} />
        ))}
      </div>
      <div className="mt-auto pt-10" />
    </div>
  );
}
