import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPageView } from "@/components/marketing/landing-page-view";
import { MARKETING_ROUTES } from "@/lib/company/company-links";
import { INDUSTRY_PAGES, INDUSTRY_SLUGS } from "@/lib/seo/industry-content";
import { createPageMetadataForPath } from "@/lib/seo";

type IndustryPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return INDUSTRY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: IndustryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = INDUSTRY_PAGES[slug];
  if (!content) return { title: "Industry" };

  return createPageMetadataForPath(content.path);
}

export default async function IndustryDetailPage({ params }: IndustryPageProps) {
  const { slug } = await params;
  const content = INDUSTRY_PAGES[slug];
  if (!content) notFound();

  return (
    <LandingPageView
      content={content}
      breadcrumbParent={{ name: "Industries", path: MARKETING_ROUTES.industries }}
    />
  );
}
