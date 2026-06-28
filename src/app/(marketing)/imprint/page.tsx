import type { Metadata } from "next";
import { LegalPageView } from "@/components/marketing/legal-page-view";
import { LEGAL_PAGES } from "@/lib/company/legal-content";
import { createMarketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: LEGAL_PAGES.imprint.title,
  description: LEGAL_PAGES.imprint.description,
  path: "/imprint",
});

export default function ImprintPage() {
  return <LegalPageView pageKey="imprint" />;
}
