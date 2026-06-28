import type { Metadata } from "next";
import { LegalPageView } from "@/components/marketing/legal-page-view";
import { LEGAL_PAGES } from "@/lib/company/legal-content";
import { createMarketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: LEGAL_PAGES.privacy.title,
  description: LEGAL_PAGES.privacy.description,
  path: "/privacy",
});

export default function PrivacyPage() {
  return <LegalPageView pageKey="privacy" />;
}
