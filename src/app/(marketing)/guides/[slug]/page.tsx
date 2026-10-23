import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuidePageView } from "@/components/marketing/guide-page-view";
import { createPageMetadataForPath } from "@/lib/seo";
import { GUIDE_PAGES, GUIDE_SLUGS } from "@/lib/seo/guides-content";

type GuidePageProps = {
  params: Promise<{ slug: string }>;
};

/** Unknown guide slugs must 404 — do not soft-render the not-found UI as HTTP 200. */
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = GUIDE_PAGES[slug];
  if (!guide) notFound();

  return createPageMetadataForPath(guide.path);
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = GUIDE_PAGES[slug];
  if (!guide) notFound();

  return <GuidePageView guide={guide} />;
}
