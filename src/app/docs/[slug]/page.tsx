import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocPageLayout } from "@/components/docs/doc-page-layout";
import { getAllDocSlugs, getDocPage } from "@/lib/docs/registry";

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

  return {
    title: doc.title,
    description: doc.description,
  };
}

export default async function DocTopicPage({ params }: DocTopicPageProps) {
  const { slug } = await params;
  const doc = getDocPage(slug);

  if (!doc) {
    notFound();
  }

  // TEMP DEBUG — docs live render audit (remove after verification)
  console.log("[docs audit]", slug, {
    keys: Object.keys(doc),
    sectionCount: [
      doc.overview,
      doc.purpose,
      doc.coreConcepts,
      doc.features,
      doc.stepByStepUsage,
      doc.bestPractices,
      doc.examples,
      doc.troubleshooting,
    ].filter(
      (block) =>
        block.paragraphs?.length ||
        block.bullets?.length ||
        block.ordered?.length ||
        block.subsections?.length ||
        block.table,
    ).length,
    faqCount: doc.faq.length,
    relatedDocsCount: doc.relatedDocs.length,
  });

  return <DocPageLayout doc={doc} />;
}
