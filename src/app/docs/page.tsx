import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BookOpen, ScrollText } from "lucide-react";
import { DocsViewTracker } from "@/components/analytics/docs-view-tracker";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PublicAppLink } from "@/components/marketing/public-app-link";
import { COMPANY_NAME, DOCS_URL, SUPPORT_EMAIL } from "@/lib/company/contact";
import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { DOCS_HUB_DOC, DOC_HUB_CARDS } from "@/lib/docs/registry";
import { JsonLdScript } from "@/lib/marketing/seo";
import { createPageMetadataForPath } from "@/lib/seo";
import { collectionPageGraphJsonLd } from "@/lib/seo/geo-schema";
import { cn } from "@/lib/utils/cn";
import { getAuroraModule, auroraSurfaceInteractive } from "@/lib/ui/aurora";
import { focusRing } from "@/lib/ui/tokens";

export const metadata: Metadata = createPageMetadataForPath("/docs");

const HUB_ICONS = {
  "getting-started": BookOpen,
  "release-notes": ScrollText,
} as const;

export default function DocsHubPage() {
  const docItems = [
    ...DOC_HUB_CARDS.map((card) => ({
      name: card.title,
      path: card.href ?? `/docs/${card.slug}`,
      description: card.description,
    })),
    {
      name: "Release Notes",
      path: "/docs/release-notes",
      description: "Product updates and platform changes.",
    },
  ];

  return (
    <MarketingShell>
      <JsonLdScript
        data={collectionPageGraphJsonLd({
          title: "Documentation",
          description: `${COMPANY_NAME} product documentation hub for agencies and operations teams.`,
          path: "/docs",
          items: docItems,
        })}
      />
      <DocsViewTracker />
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${BRANDING_ASSETS.heroBanner})` }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/85 to-secondary/50"
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-10 sm:py-12">
          <div>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">{COMPANY_NAME} Docs</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-primary-foreground/85">
              {DOCS_HUB_DOC.intro}
            </p>
          </div>
          <Suspense
            fallback={
              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm text-white/60">App</span>
            }
          >
            <PublicAppLink className="inline-flex shrink-0 items-center gap-1.5 text-sm text-white hover:underline" />
          </Suspense>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DOC_HUB_CARDS.map((card) => {
            const identity = getAuroraModule(card.module);
            const href = card.href ?? `/docs/${card.slug}`;
            const Icon = HUB_ICONS[card.slug as keyof typeof HUB_ICONS] ?? BookOpen;

            return (
              <Link
                key={card.slug}
                href={href}
                className={cn(
                  auroraSurfaceInteractive,
                  "block rounded-2xl border border-white/10 bg-white/[0.03] p-5",
                  focusRing,
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl border",
                    identity.iconContainer,
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="mt-4 font-semibold text-white">{card.title}</h2>
                <p className="mt-2 text-sm text-primary-foreground/75">{card.description}</p>
              </Link>
            );
          })}

          <Link
            href="/docs/release-notes"
            className={cn(
              auroraSurfaceInteractive,
              "block rounded-2xl border border-white/10 bg-white/[0.03] p-5",
              focusRing,
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border",
                getAuroraModule("settings").iconContainer,
              )}
            >
              <ScrollText className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-4 font-semibold text-white">Release Notes</h2>
            <p className="mt-2 text-sm text-primary-foreground/75">Product updates and platform changes.</p>
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-semibold text-white">Related resources</h2>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/75">
              {DOCS_HUB_DOC.relatedDocs.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href={DOCS_URL} className="hover:text-white hover:underline" target="_blank" rel="noopener noreferrer">
                  External docs site
                </a>
              </li>
              <li>
                <Link href="/docs/api" className="hover:text-white hover:underline">
                  OpenAPI reference
                </Link>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-semibold text-white">Need help?</h2>
            <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">
              Email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-white hover:underline">
                {SUPPORT_EMAIL}
              </a>{" "}
              for onboarding, billing, or product questions. Signed-in users can also open Settings → Support.
            </p>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
