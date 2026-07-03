export type DocCalloutVariant = "info" | "tip" | "warning";

export type DocCallout = {
  variant: DocCalloutVariant;
  title?: string;
  body: string;
};

export type DocTable = {
  caption?: string;
  headers: string[];
  rows: string[][];
};

export type DocSubsection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  ordered?: string[];
  table?: DocTable;
};

/** Reusable content block — supports section.subsections and section.table. */
export type DocContentBlock = {
  paragraphs?: string[];
  bullets?: string[];
  ordered?: string[];
  subsections?: DocSubsection[];
  table?: DocTable;
};

export type DocFaqItem = {
  question: string;
  answer: string;
};

export type DocRelatedLink = {
  href: string;
  label: string;
};

export type DocPageContent = {
  slug: string;
  title: string;
  description: string;
  intro: string;
  callouts?: DocCallout[];
  overview: DocContentBlock;
  purpose: DocContentBlock;
  coreConcepts: DocContentBlock;
  features: DocContentBlock;
  stepByStepUsage: DocContentBlock;
  bestPractices: DocContentBlock;
  examples: DocContentBlock;
  troubleshooting: DocContentBlock;
  faq: DocFaqItem[];
  relatedDocs: DocRelatedLink[];
};

/** @deprecated Legacy section shape — normalized via buildDocPage(). */
export type DocSection = {
  id?: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  ordered?: string[];
  subsections?: DocSubsection[];
  table?: DocTable;
};

export const DOC_PAGE_SECTION_ORDER = [
  { id: "overview", title: "Overview", key: "overview" },
  { id: "purpose", title: "Purpose", key: "purpose" },
  { id: "core-concepts", title: "Core Concepts", key: "coreConcepts" },
  { id: "features", title: "Features", key: "features" },
  { id: "step-by-step-usage", title: "Step-by-step usage", key: "stepByStepUsage" },
  { id: "best-practices", title: "Best Practices", key: "bestPractices" },
  { id: "examples", title: "Examples", key: "examples" },
  { id: "troubleshooting", title: "Troubleshooting", key: "troubleshooting" },
] as const satisfies ReadonlyArray<{
  id: string;
  title: string;
  key: keyof Pick<
    DocPageContent,
    | "overview"
    | "purpose"
    | "coreConcepts"
    | "features"
    | "stepByStepUsage"
    | "bestPractices"
    | "examples"
    | "troubleshooting"
  >;
}>;

export type DocPageSectionKey = (typeof DOC_PAGE_SECTION_ORDER)[number]["key"];

export type DocPageInput = {
  slug: string;
  title: string;
  description: string;
  intro: string;
  callouts?: DocCallout[];
  overview?: DocContentBlock;
  purpose?: DocContentBlock;
  coreConcepts?: DocContentBlock;
  features?: DocContentBlock;
  stepByStepUsage?: DocContentBlock;
  bestPractices?: DocContentBlock;
  examples?: DocContentBlock;
  troubleshooting?: DocContentBlock;
  faq?: DocFaqItem[];
  relatedDocs?: DocRelatedLink[];
  /** @deprecated Use relatedDocs */
  relatedLinks?: DocRelatedLink[];
  /** Legacy sections array — mapped to explicit fields by title. */
  sections?: DocSection[];
};
