import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/marketing/contact-form";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero, MarketingSection } from "@/components/marketing/marketing-sections";
import { MARKETING_ROUTES, SECURITY_EMAIL, SUPPORT_EMAIL } from "@/lib/company/contact";
import { createMarketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "Support",
  description: "Auroranexis product support and customer success.",
  path: "/support",
});

export default function SupportPage() {
  return (
    <MarketingShell>
      <MarketingHero
        eyebrow="Support"
        title="We are here to help"
        description="Product support, onboarding assistance, and pilot program guidance."
        primaryHref={`mailto:${SUPPORT_EMAIL}`}
        primaryLabel={`Email ${SUPPORT_EMAIL}`}
        secondaryHref={MARKETING_ROUTES.contact}
        secondaryLabel="Contact form"
      />
      <MarketingSection title="Support channels">
        <ul className="space-y-4 text-sm text-muted">
          <li>
            <strong className="text-foreground">Product support:</strong>{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </li>
          <li>
            <strong className="text-foreground">Documentation:</strong>{" "}
            <Link href={MARKETING_ROUTES.documentation} className="text-primary hover:underline">
              Documentation hub
            </Link>
          </li>
          <li>
            <strong className="text-foreground">System status:</strong>{" "}
            <Link href={MARKETING_ROUTES.status} className="text-primary hover:underline">
              Status page
            </Link>
          </li>
          <li>
            <strong className="text-foreground">Security issues:</strong>{" "}
            <a href={`mailto:${SECURITY_EMAIL}`} className="text-primary hover:underline">
              {SECURITY_EMAIL}
            </a>
          </li>
          <li>
            <strong className="text-foreground">Pilot program:</strong>{" "}
            <Link href={MARKETING_ROUTES.pilotProgram} className="text-primary hover:underline">
              Apply for pilot
            </Link>
          </li>
        </ul>
      </MarketingSection>
      <MarketingSection title="Send a message" className="border-t border-border/70 bg-surface-2/30">
        <div className="max-w-2xl">
          <ContactForm />
        </div>
      </MarketingSection>
    </MarketingShell>
  );
}
