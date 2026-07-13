import type { LandingPageContent } from "@/lib/seo/landing-page-types";

type BuildLandingPageInput = Omit<LandingPageContent, "slug" | "path"> & {
  slug: string;
  pathPrefix: "/features" | "/use-cases" | "/industries";
};

export function buildLandingPage(input: BuildLandingPageInput): LandingPageContent {
  const { pathPrefix, slug, ...rest } = input;
  return {
    slug,
    path: `${pathPrefix}/${slug}`,
    ...rest,
  };
}

export function landingPageSlugs(pages: Record<string, LandingPageContent>): string[] {
  return Object.keys(pages);
}

export function landingPageList(pages: Record<string, LandingPageContent>): LandingPageContent[] {
  return Object.values(pages);
}
