import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { createPrivateAppMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPrivateAppMetadata("Legal redirect");

export default function LegacyCookiesRedirect() {
  permanentRedirect("/cookies");
}
