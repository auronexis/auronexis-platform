import type { Metadata } from "next";
import { LegalPageView } from "@/components/marketing/legal-page-view";
import { LEGAL_PAGES } from "@/lib/company/legal-content";
import { createMarketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: LEGAL_PAGES.terms.title,
  description: LEGAL_PAGES.terms.description,
  path: "/terms",
});

export default function TermsPage() {
  return <LegalPageView pageKey="terms" />;
}
