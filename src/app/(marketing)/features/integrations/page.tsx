import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { createPrivateAppMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPrivateAppMetadata("Integrations redirect");

/**
 * Loser hub — canonical public integrations live at /integrations.
 * force-dynamic + vercel.json 308 avoid serving a stale prerendered 200 HTML body.
 */
export const dynamic = "force-dynamic";

export default function FeaturesIntegrationsAliasPage() {
  permanentRedirect("/integrations");
}
