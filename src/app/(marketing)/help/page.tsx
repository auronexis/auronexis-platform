import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero, MarketingSection } from "@/components/marketing/marketing-sections";
import { HELP_TOPICS } from "@/lib/marketing/content";
import { MARKETING_ROUTES, SUPPORT_EMAIL } from "@/lib/company/contact";
import { createMarketingMetadata } from "@/lib/marketing/seo";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

export const metadata: Metadata = createMarketingMetadata({
  title: "Help Center",
  description: "Auroranexis help center — documentation, status, and support.",
  path: "/help",
});

export default function HelpPage() {
  return (
    <MarketingShell>
      <MarketingHero
        eyebrow="Help"
        title="Help Center"
        description="Documentation, status updates, pilot program, and support channels."
        primaryHref={MARKETING_ROUTES.documentation}
        primaryLabel="Documentation"
        secondaryHref={MARKETING_ROUTES.support}
        secondaryLabel="Support"
      />
      <MarketingSection title="Search support">
        <label className="block max-w-xl">
          <span className="sr-only">Search help</span>
          <input
            type="search"
            placeholder="Search documentation and help topics (placeholder)"
            className="w-full rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm"
            disabled
          />
        </label>
        <p className="mt-2 text-xs text-muted">Search indexing is planned — browse topics below or email {SUPPORT_EMAIL}.</p>
      </MarketingSection>
      <MarketingSection title="Popular topics" className="border-t border-border/70 bg-surface-2/30">
        <div className="grid gap-4 md:grid-cols-2">
          {HELP_TOPICS.map((topic) => (
            <Link key={topic.href} href={topic.href} className={cn("rounded-2xl border border-border-subtle bg-surface-1 p-5 hover:border-primary/20", focusRing)}>
              <h3 className="font-semibold text-foreground">{topic.title}</h3>
              <p className="mt-2 text-sm text-muted">{topic.description}</p>
            </Link>
          ))}
        </div>
      </MarketingSection>
    </MarketingShell>
  );
}
