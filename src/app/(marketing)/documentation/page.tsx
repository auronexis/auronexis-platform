import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { createPrivateAppMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPrivateAppMetadata("Documentation redirect");

/** Loser hub — canonical public documentation lives at /docs. */
export default function DocumentationAliasPage() {
  permanentRedirect("/docs");
}
