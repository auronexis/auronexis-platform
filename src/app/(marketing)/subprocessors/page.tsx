import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { LegalPageView } from "@/components/marketing/legal-page-view";

export const metadata: Metadata = createPageMetadataForPath("/subprocessors");

export default function SubprocessorsPage() {
  return <LegalPageView pageKey="subprocessors" />;
}
