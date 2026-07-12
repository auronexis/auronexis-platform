import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { LegalPageView } from "@/components/marketing/legal-page-view";

export const metadata: Metadata = createPageMetadataForPath("/cookies");

export default function CookiesPage() {
  return <LegalPageView pageKey="cookies" />;
}
