import type { Metadata } from "next";
import { LegalPageView } from "@/components/marketing/legal-page-view";
import { LEGAL_PAGES } from "@/lib/company/legal-content";
import { createMarketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: LEGAL_PAGES.securityPolicy.title,
  description: LEGAL_PAGES.securityPolicy.description,
  path: "/security-policy",
});

export default function SecurityPolicyPage() {
  return <LegalPageView pageKey="securityPolicy" />;
}
