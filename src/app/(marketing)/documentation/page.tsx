import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight, BookOpen, FileCode2, ScrollText } from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingSection } from "@/components/marketing/marketing-sections";
import { HELP_TOPICS } from "@/lib/marketing/content";
import { DOCS_URL } from "@/lib/company/contact";
import { cn } from "@/lib/utils/cn";
import { getAuroraModule, auroraSurfaceInteractive } from "@/lib/ui/aurora";
import { focusRing } from "@/lib/ui/tokens";

export const metadata: Metadata = createPageMetadataForPath("/documentation");

const DOC_LINKS = [
  { href: "/docs", label: "Documentation hub", icon: BookOpen, module: "dashboard" as const },
  { href: "/docs/getting-started", label: "Getting started", icon: BookOpen, module: "dashboard" as const },
  { href: "/docs/release-notes", label: "Release notes", icon: ScrollText, module: "settings" as const },
  { href: "/api/docs", label: "API reference", icon: FileCode2, module: "settings" as const },
] as const;

export default function DocumentationPage() {
  return (
    <MarketingShell>
      <MarketingHero
        eyebrow="Documentation"
        title="Product documentation"
        description="Guides for workspace setup, modules, integrations, billing, and API usage. The full product documentation hub lives at /docs."
        primaryHref="/docs"
        primaryLabel="Open docs hub"
        secondaryHref="/docs/getting-started"
        secondaryLabel="Getting started"
      />
      <MarketingSection title="Start here">
        <div className="grid gap-4 sm:grid-cols-2">
          {DOC_LINKS.map((link) => {
            const identity = getAuroraModule(link.module);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(auroraSurfaceInteractive, "flex items-center gap-4 p-5", focusRing)}
              >
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", identity.iconContainer)}>
                  <link.icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="flex-1 font-medium text-foreground">{link.label}</span>
                <ArrowRight className="h-4 w-4 text-muted" aria-hidden />
              </Link>
            );
          })}
        </div>
        <p className="mt-6 text-sm text-muted">
          The documentation hub at <Link href="/docs" className="font-medium text-primary hover:underline">/docs</Link> contains
          the complete product guides. This page is the marketing entry point for evaluation and onboarding.
          {" "}
          Full documentation is also published at{" "}
          <a href={DOCS_URL} className="font-medium text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            {DOCS_URL.replace("https://", "")}
          </a>
          .
        </p>
      </MarketingSection>
      <MarketingSection title="Help topics" className="border-t border-border/70 bg-surface-2/30">
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
