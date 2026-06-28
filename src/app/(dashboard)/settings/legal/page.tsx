import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsNavCard } from "@/components/settings/settings-nav-card";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { LEGAL_ROUTES } from "@/lib/company/contact";
import { LEGAL_PAGES } from "@/lib/company/legal-content";
import { FileText, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Legal",
};

const LEGAL_LINKS = [
  { href: LEGAL_ROUTES.imprint, title: "Imprint", description: LEGAL_PAGES.imprint.description, icon: FileText },
  { href: LEGAL_ROUTES.privacy, title: "Privacy Policy", description: LEGAL_PAGES.privacy.description, icon: Shield },
  { href: LEGAL_ROUTES.terms, title: "Terms of Service", description: LEGAL_PAGES.terms.description, icon: FileText },
  { href: LEGAL_ROUTES.cookies, title: "Cookie Policy", description: LEGAL_PAGES.cookies.description, icon: Shield },
] as const;

export default async function SettingsLegalPage() {
  await requireModuleAccess("settings");

  return (
    <>
      <PageHeader
        module="settings"
        title="Legal"
        description="Privacy, terms, and regulatory information."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {LEGAL_LINKS.map((item) => (
          <SettingsNavCard key={item.href} {...item} />
        ))}
      </div>
    </>
  );
}
