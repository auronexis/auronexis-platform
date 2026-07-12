export {
  createPageMetadata,
  createPageMetadataForPath,
  createPrivateAppMetadata,
  getSeoBaseUrl,
  getSiteVerificationMetadata,
  isPreviewDeployment,
  resolveMetadataBase,
  shouldNoIndex,
  type PageMetadataInput,
} from "@/lib/seo/metadata";

export {
  NOINDEX_ROUTES,
  PAGE_SEO,
  PRIVATE_ROUTE_PREFIXES,
  PUBLIC_SITEMAP_ROUTES,
  SOLUTION_ROUTES,
  TEMPLATE_ROUTES,
  isPrivateRoute,
} from "@/lib/seo/routes";

export {
  articleJsonLd,
  breadcrumbJsonLd,
  enterpriseOfferJsonLd,
  faqJsonLd,
  organizationJsonLd,
  pilotProgramJsonLd,
  pricingPageJsonLd,
  softwareApplicationJsonLd,
  techArticleJsonLd,
  websiteJsonLd,
} from "@/lib/seo/structured-data";

export { buildSitemapEntries } from "@/lib/seo/sitemap";
export { buildRobotsConfig } from "@/lib/seo/robots";
export {
  trackAnalyticsEvent,
  type AnalyticsEventName,
  type AnalyticsEventProps,
} from "@/lib/seo/analytics-events";
