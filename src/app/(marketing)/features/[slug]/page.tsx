import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPageView } from "@/components/marketing/landing-page-view";
import { MARKETING_ROUTES } from "@/lib/company/company-links";
import { FEATURE_PAGES, FEATURE_SLUGS } from "@/lib/seo/feature-content";
import { createPageMetadataForPath } from "@/lib/seo";

type FeaturePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return FEATURE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: FeaturePageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = FEATURE_PAGES[slug];
  if (!content) return { title: "Feature" };

  return createPageMetadataForPath(content.path);
}

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { slug } = await params;
  const content = FEATURE_PAGES[slug];
  if (!content) notFound();

  return (
    <LandingPageView
      content={content}
      breadcrumbParent={{ name: "Features", path: MARKETING_ROUTES.features }}
    />
  );
}
