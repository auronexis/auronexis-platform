import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ContactForm } from "@/components/marketing/contact-form";
import { DemoBookingForm } from "@/components/marketing/demo-booking-form";
import { EnterpriseContactCard } from "@/components/marketing/enterprise-contact-card";
import { HideWhenAuthenticated } from "@/components/marketing/hide-when-authenticated";
import { ReferralLeadForm } from "@/components/marketing/referral-lead-form";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingSection } from "@/components/marketing/marketing-sections";
import {
  ACTIVE_ENTERPRISE_CONTACT_CHANNELS,
  FUTURE_ENTERPRISE_CONTACT_CHANNELS,
} from "@/lib/company/contact-channels";
import { JsonLdScript, contactPageJsonLd } from "@/lib/marketing/seo";
import { PAGE_SEO } from "@/lib/seo/routes";

export const metadata: Metadata = createPageMetadataForPath("/contact");

export default function ContactPage() {
  const contactSeo = PAGE_SEO["/contact"];
  return (
    <MarketingShell>
      <JsonLdScript
        data={contactPageJsonLd({
          title: contactSeo.title,
          description: contactSeo.description,
        })}
      />
      <MarketingHero
        eyebrow="Contact"
        title="Talk to our team"
        description="Sales, support, and security — reach the right team at Auroranexis."
        primaryHref="#message"
        primaryLabel="Send a message"
      />
      <MarketingSection title="Primary contact channels">
        <div className="grid gap-4 md:grid-cols-3">
          {ACTIVE_ENTERPRISE_CONTACT_CHANNELS.map((channel) => (
            <EnterpriseContactCard key={channel.id} channel={channel} variant="marketing" />
          ))}
        </div>
      </MarketingSection>
      <MarketingSection
        title="Enterprise contact channels"
        className="border-t border-border/70 bg-surface-2/30"
      >
        <p className="mb-6 max-w-3xl text-sm text-muted">
          Additional dedicated channels for legal, privacy, partnerships, and media inquiries.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FUTURE_ENTERPRISE_CONTACT_CHANNELS.map((channel) => (
            <EnterpriseContactCard key={channel.id} channel={channel} variant="marketing" />
          ))}
        </div>
      </MarketingSection>
      <HideWhenAuthenticated>
        <MarketingSection title="Book a demo" className="border-t border-border/70 bg-surface-2/30">
          <div className="max-w-2xl">
            <DemoBookingForm />
          </div>
        </MarketingSection>
      </HideWhenAuthenticated>
      <MarketingSection title="Partner referral" className="border-t border-border/70 bg-surface-2/30">
        <div className="max-w-2xl">
          <ReferralLeadForm />
        </div>
      </MarketingSection>
      <MarketingSection id="message" title="Send a message" className="border-t border-border/70 bg-surface-2/30">
        <div className="max-w-2xl">
          <ContactForm />
        </div>
      </MarketingSection>
    </MarketingShell>
  );
}
