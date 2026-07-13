import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPageView } from "@/components/marketing/landing-page-view";
import { MARKETING_ROUTES } from "@/lib/company/company-links";
import { AUDIENCE_PAGES, AUDIENCE_SLUGS } from "@/lib/seo/audience-content";
import { createPageMetadataForPath } from "@/lib/seo";

type UseCasePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return AUDIENCE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: UseCasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = AUDIENCE_PAGES[slug];
  if (!content) return { title: "Use case" };

  return createPageMetadataForPath(content.path);
}

export default async function UseCaseDetailPage({ params }: UseCasePageProps) {
  const { slug } = await params;
  const content = AUDIENCE_PAGES[slug];
  if (!content) notFound();

  return (
    <LandingPageView
      content={content}
      breadcrumbParent={{ name: "Use cases", path: MARKETING_ROUTES.useCases }}
    />
  );
}
