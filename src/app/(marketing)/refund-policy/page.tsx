import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { LegalPageView } from "@/components/marketing/legal-page-view";

export const metadata: Metadata = createPageMetadataForPath("/refund-policy");

export default function RefundPolicyPage() {
  return <LegalPageView pageKey="refundPolicy" />;
}
