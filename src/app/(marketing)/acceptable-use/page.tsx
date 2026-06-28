import type { Metadata } from "next";
import { LegalPageView } from "@/components/marketing/legal-page-view";
import { LEGAL_PAGES } from "@/lib/company/legal-content";
import { createMarketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: LEGAL_PAGES.acceptableUse.title,
  description: LEGAL_PAGES.acceptableUse.description,
  path: "/acceptable-use",
});

export default function AcceptableUsePage() {
  return <LegalPageView pageKey="acceptableUse" />;
}
