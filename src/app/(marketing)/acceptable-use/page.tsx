import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { LegalPageView } from "@/components/marketing/legal-page-view";

export const metadata: Metadata = createPageMetadataForPath("/acceptable-use");

export default function AcceptableUsePage() {
  return <LegalPageView pageKey="acceptableUse" />;
}
