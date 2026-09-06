import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { createPrivateAppMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPrivateAppMetadata("Integrations redirect");

/** Loser hub — canonical public integrations live at /integrations. */
export default function FeaturesIntegrationsAliasPage() {
  permanentRedirect("/integrations");
}
