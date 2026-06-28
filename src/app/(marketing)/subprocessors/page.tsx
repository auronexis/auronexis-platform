import type { Metadata } from "next";
import { LegalPageView } from "@/components/marketing/legal-page-view";
import { LEGAL_PAGES } from "@/lib/company/legal-content";
import { createMarketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: LEGAL_PAGES.subprocessors.title,
  description: LEGAL_PAGES.subprocessors.description,
  path: "/subprocessors",
});

export default function SubprocessorsPage() {
  return <LegalPageView pageKey="subprocessors" />;
}
