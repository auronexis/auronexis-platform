import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { LegalPageView } from "@/components/marketing/legal-page-view";

export const metadata: Metadata = createPageMetadataForPath("/data-processing-agreement");

export default function DpaPage() {
  return <LegalPageView pageKey="dataProcessingAgreement" />;
}
