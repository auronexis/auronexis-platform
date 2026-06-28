import type { Metadata } from "next";
import { LegalPageView } from "@/components/marketing/legal-page-view";
import { LEGAL_PAGES } from "@/lib/company/legal-content";
import { createMarketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: LEGAL_PAGES.dataProcessingAgreement.title,
  description: LEGAL_PAGES.dataProcessingAgreement.description,
  path: "/data-processing-agreement",
});

export default function DpaPage() {
  return <LegalPageView pageKey="dataProcessingAgreement" />;
}
