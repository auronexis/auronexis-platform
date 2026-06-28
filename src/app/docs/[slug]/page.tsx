import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { COMPANY_NAME } from "@/lib/company/contact";

type DocTopicPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: DocTopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { title };
}

export default async function DocTopicPage({ params }: DocTopicPageProps) {
  const { slug } = await params;
  const title = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <MarketingShell>
      <section className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-8">
          <div>
            <h1 className="text-xl font-semibold text-white sm:text-2xl">{title}</h1>
            <p className="text-sm text-primary-foreground/75">{COMPANY_NAME} documentation</p>
          </div>
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/90 hover:text-white hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All docs
          </Link>
        </div>
      </section>

      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <p className="text-sm leading-relaxed text-primary-foreground/75">
          This guide covers {title.toLowerCase()} in {COMPANY_NAME}. Full documentation is available in your
          workspace Help menu and at Settings → Diagnostics for environment-specific configuration.
        </p>
        <p className="mt-4 text-sm text-primary-foreground/75">
          For pilot support, contact{" "}
          <a href="mailto:support@auroranexis.com" className="text-white hover:underline">
            support@auroranexis.com
          </a>
          .
        </p>
      </div>
    </MarketingShell>
  );
}
