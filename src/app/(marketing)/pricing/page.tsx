import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { AuthAwareMarketingLink } from "@/components/marketing/auth-aware-marketing-link";
import { NewsletterSignupForm } from "@/components/marketing/newsletter-signup-form";
import { MarketingHero, MarketingSection } from "@/components/marketing/marketing-sections";
import { PUBLIC_PRICING_PLANS, PUBLIC_PRICING_NOTE } from "@/lib/marketing/content";
import { MARKETING_ROUTES, SALES_EMAIL } from "@/lib/company/contact";
import { createMarketingMetadata } from "@/lib/marketing/seo";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

export const metadata: Metadata = createMarketingMetadata({
  title: "Pricing",
  description: "Compare Auroranexis plans for agencies and service providers.",
  path: "/pricing",
});

export default function PublicPricingPage() {
  return (
    <MarketingShell>
      <MarketingHero
        eyebrow="Pricing"
        title="Professional, Business, and Enterprise"
        description="Three public subscription tiers for agencies. Enterprise pricing is negotiated. Pilot Partner and Founding programs are limited cohort offers with separate terms."
        primaryHref="/signup"
        primaryLabel="Get started"
        secondaryHref="/login"
        secondaryLabel="Sign in"
      />
      <MarketingSection title="Plans">
        <div className="grid gap-4 lg:grid-cols-3">
          {PUBLIC_PRICING_PLANS.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                "rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm",
                plan.featured && "border-primary/20 ring-1 ring-primary/10",
              )}
            >
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {plan.price}
                {plan.period ? (
                  <span className="text-base font-normal text-muted">{plan.period}</span>
                ) : (
                  <span className="block text-base font-normal text-muted">pricing</span>
                )}
              </p>
              <p className="mt-3 text-sm text-muted">{plan.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {plan.highlights.map((highlight) => (
                  <li key={highlight}>• {highlight}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-sm text-muted">{PUBLIC_PRICING_NOTE}</p>
        <p className="mt-4 text-sm text-muted">
          Existing customers can compare plans and upgrade in{" "}
          <AuthAwareMarketingLink href="/settings/plans" className="font-medium text-primary hover:underline">
            workspace billing
          </AuthAwareMarketingLink>
          . Enterprise questions?{" "}
          <AuthAwareMarketingLink
            href={MARKETING_ROUTES.contact}
            contactIntent="enterprise"
            className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}
          >
            Contact sales
          </AuthAwareMarketingLink>{" "}
          at{" "}
          <a href={`mailto:${SALES_EMAIL}`} className="font-medium text-primary hover:underline">
            {SALES_EMAIL}
          </a>
          .
        </p>
      </MarketingSection>
      <MarketingSection title="Product updates" className="border-t border-white/10 bg-white/[0.02]">
        <p className="mb-4 max-w-2xl text-sm text-primary-foreground/75">
          Subscribe for launch updates, release notes, and founding customer program news.
        </p>
        <NewsletterSignupForm />
      </MarketingSection>
    </MarketingShell>
  );
}
