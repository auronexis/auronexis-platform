import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Shield } from "lucide-react";
import { PortalCard } from "@/components/client-portal/portal-ui";
import { PageHeader } from "@/components/layout/page-header";
import { LEGAL_ROUTES } from "@/lib/company/contact";
import { LEGAL_PAGES } from "@/lib/company/legal-content";

export const metadata: Metadata = {
  title: "Legal",
};

const PORTAL_LEGAL_LINKS = [
  { href: LEGAL_ROUTES.privacy, title: "Privacy Policy", key: "privacy" as const, icon: Shield },
  { href: LEGAL_ROUTES.terms, title: "Terms of Service", key: "terms" as const, icon: FileText },
  { href: LEGAL_ROUTES.cookies, title: "Cookie Policy", key: "cookies" as const, icon: Shield },
  { href: LEGAL_ROUTES.imprint, title: "Imprint", key: "imprint" as const, icon: FileText },
];

export default function ClientPortalLegalPage() {
  return (
    <>
      <PageHeader
        title="Legal"
        description="Policies that apply to your use of this client portal."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {PORTAL_LEGAL_LINKS.map((item) => (
          <Link key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
            <PortalCard hover className="h-full p-5">
              <item.icon className="h-5 w-5 text-primary" aria-hidden />
              <p className="mt-3 font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-sm text-muted">{LEGAL_PAGES[item.key].description}</p>
            </PortalCard>
          </Link>
        ))}
      </div>
    </>
  );
}
