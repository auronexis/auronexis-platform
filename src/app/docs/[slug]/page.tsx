import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocPageLayout } from "@/components/docs/doc-page-layout";
import { getAllDocSlugs, getDocPage } from "@/lib/docs/registry";
import { createPageMetadata } from "@/lib/seo";

type DocTopicPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllDocSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: DocTopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDocPage(slug);

  if (!doc) {
    return { title: "Documentation" };
  }

  return createPageMetadata({
    title: doc.title,
    description: doc.description,
    path: `/docs/${slug}`,
  });
}

export default async function DocTopicPage({ params }: DocTopicPageProps) {
  const { slug } = await params;
  const doc = getDocPage(slug);

  if (!doc) {
    notFound();
  }

  return <DocPageLayout doc={doc} />;
}
