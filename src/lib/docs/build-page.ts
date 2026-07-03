import type {
  DocContentBlock,
  DocPageContent,
  DocPageInput,
  DocPageSectionKey,
  DocSection,
} from "@/lib/docs/types";
import { DOC_PAGE_SECTION_ORDER } from "@/lib/docs/types";

const EMPTY_BLOCK: DocContentBlock = {};

const LEGACY_SECTION_MAP: Record<string, DocPageSectionKey> = {
  Overview: "overview",
  Purpose: "purpose",
  "Core Concepts": "coreConcepts",
  Features: "features",
  "Step-by-step usage": "stepByStepUsage",
  "Best Practices": "bestPractices",
  Examples: "examples",
  Troubleshooting: "troubleshooting",
};

function sectionToBlock(section: DocSection): DocContentBlock {
  return {
    paragraphs: section.paragraphs,
    bullets: section.bullets,
    ordered: section.ordered,
    subsections: section.subsections,
    table: section.table,
  };
}

function isEmptyBlock(block: DocContentBlock | undefined): boolean {
  if (!block) return true;
  return !(
    block.paragraphs?.length ||
    block.bullets?.length ||
    block.ordered?.length ||
    block.subsections?.length ||
    block.table
  );
}

/** Build a normalized doc page from explicit fields and/or legacy sections. */
export function buildDocPage(input: DocPageInput): DocPageContent {
  const blocks: Record<DocPageSectionKey, DocContentBlock> = {
    overview: input.overview ?? EMPTY_BLOCK,
    purpose: input.purpose ?? EMPTY_BLOCK,
    coreConcepts: input.coreConcepts ?? EMPTY_BLOCK,
    features: input.features ?? EMPTY_BLOCK,
    stepByStepUsage: input.stepByStepUsage ?? EMPTY_BLOCK,
    bestPractices: input.bestPractices ?? EMPTY_BLOCK,
    examples: input.examples ?? EMPTY_BLOCK,
    troubleshooting: input.troubleshooting ?? EMPTY_BLOCK,
  };

  if (input.sections?.length) {
    for (const section of input.sections) {
      const key = LEGACY_SECTION_MAP[section.title];
      if (key) {
        blocks[key] = sectionToBlock(section);
      }
    }
  }

  return {
    slug: input.slug,
    title: input.title,
    description: input.description,
    intro: input.intro,
    callouts: input.callouts,
    overview: blocks.overview,
    purpose: blocks.purpose,
    coreConcepts: blocks.coreConcepts,
    features: blocks.features,
    stepByStepUsage: blocks.stepByStepUsage,
    bestPractices: blocks.bestPractices,
    examples: blocks.examples,
    troubleshooting: blocks.troubleshooting,
    faq: input.faq ?? [],
    relatedDocs: input.relatedDocs ?? input.relatedLinks ?? [],
  };
}

/** Returns ordered section entries with content for rendering. */
export function getDocPageSections(doc: DocPageContent): Array<{
  id: string;
  title: string;
  block: DocContentBlock;
}> {
  return DOC_PAGE_SECTION_ORDER.map(({ id, title, key }) => ({
    id,
    title,
    block: doc[key],
  })).filter(({ block }) => !isEmptyBlock(block));
}
