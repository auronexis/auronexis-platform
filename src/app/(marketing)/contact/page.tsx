import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ContactForm } from "@/components/marketing/contact-form";
import { DemoBookingForm } from "@/components/marketing/demo-booking-form";
import { HideWhenAuthenticated } from "@/components/marketing/hide-when-authenticated";
import { ReferralLeadForm } from "@/components/marketing/referral-lead-form";
import { MarketingHero, MarketingSection } from "@/components/marketing/marketing-sections";
import { CONTACT_EMAILS } from "@/lib/marketing/content";
import { createMarketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "Contact",
  description: "Contact Auroranexis sales, support, and security teams.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <MarketingShell>
      <MarketingHero
        eyebrow="Contact"
        title="Talk to our team"
        description="Sales, support, and security — reach the right team at Auroranexis."
        primaryHref="#message"
        primaryLabel="Send a message"
      />
      <MarketingSection title="Contact channels">
        <div className="grid gap-4 md:grid-cols-2">
          {CONTACT_EMAILS.map((item) => (
            <article key={item.email} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="font-semibold text-white">{item.label}</h3>
              <a href={`mailto:${item.email}`} className="mt-2 block text-sm font-medium text-primary-foreground/90 hover:text-white hover:underline">
                {item.email}
              </a>
              <p className="mt-2 text-sm text-primary-foreground/75">{item.description}</p>
            </article>
          ))}
        </div>
      </MarketingSection>
      <HideWhenAuthenticated>
        <MarketingSection title="Book a demo" className="border-t border-white/10 bg-white/[0.02]">
          <div className="max-w-2xl">
            <DemoBookingForm />
          </div>
        </MarketingSection>
      </HideWhenAuthenticated>
      <MarketingSection title="Partner referral" className="border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-2xl">
          <ReferralLeadForm />
        </div>
      </MarketingSection>
      <MarketingSection id="message" title="Send a message" className="border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-2xl">
          <ContactForm />
        </div>
      </MarketingSection>
    </MarketingShell>
  );
}
