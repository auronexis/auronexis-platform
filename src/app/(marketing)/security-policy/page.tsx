import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { LegalPageView } from "@/components/marketing/legal-page-view";

export const metadata: Metadata = createPageMetadataForPath("/security-policy");

export default function SecurityPolicyPage() {
  return <LegalPageView pageKey="securityPolicy" />;
}
