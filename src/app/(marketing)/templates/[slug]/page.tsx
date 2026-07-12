import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplatePageView } from "@/components/marketing/template-page-view";
import { createPageMetadataForPath } from "@/lib/seo";
import { TEMPLATE_PAGES, TEMPLATE_SLUGS } from "@/lib/seo/landing-content";

type TemplatePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return TEMPLATE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: TemplatePageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = TEMPLATE_PAGES[slug];
  if (!content) return { title: "Template" };

  return createPageMetadataForPath(content.path);
}

export default async function TemplatePage({ params }: TemplatePageProps) {
  const { slug } = await params;
  const content = TEMPLATE_PAGES[slug];
  if (!content) notFound();

  return <TemplatePageView content={content} />;
}
