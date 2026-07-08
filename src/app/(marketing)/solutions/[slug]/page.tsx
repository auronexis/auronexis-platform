import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SolutionPageView } from "@/components/marketing/solution-page-view";
import { createPageMetadata } from "@/lib/seo";
import { SOLUTION_PAGES, SOLUTION_SLUGS } from "@/lib/seo/landing-content";

type SolutionPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return SOLUTION_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: SolutionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = SOLUTION_PAGES[slug];
  if (!content) return { title: "Solution" };

  return createPageMetadata({
    title: content.title,
    description: content.metaDescription,
    path: content.path,
  });
}

export default async function SolutionPage({ params }: SolutionPageProps) {
  const { slug } = await params;
  const content = SOLUTION_PAGES[slug];
  if (!content) notFound();

  return <SolutionPageView content={content} />;
}
