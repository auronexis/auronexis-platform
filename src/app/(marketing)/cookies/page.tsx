import type { Metadata } from "next";
import { LegalPageView } from "@/components/marketing/legal-page-view";
import { LEGAL_PAGES } from "@/lib/company/legal-content";
import { createMarketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: LEGAL_PAGES.cookies.title,
  description: LEGAL_PAGES.cookies.description,
  path: "/cookies",
});

export default function CookiesPage() {
  return <LegalPageView pageKey="cookies" />;
}
