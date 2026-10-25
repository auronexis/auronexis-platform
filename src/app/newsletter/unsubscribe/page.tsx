import type { Metadata } from "next";
import { createPrivateAppMetadata } from "@/lib/seo/metadata";
import { NewsletterLinkPage } from "@/components/marketing/newsletter-link-page";
import { unsubscribeNewsletterAction } from "@/lib/newsletter/actions";

export const dynamic = "force-dynamic";

/** Personal link pages: never indexed (createPrivateAppMetadata sets noindex, nofollow). */
export const metadata: Metadata = createPrivateAppMetadata("Unsubscribe");

type PageProps = { searchParams: Promise<{ token?: string; status?: string }> };

export default async function NewsletterUnsubscribePage({ searchParams }: PageProps) {
  const { token, status } = await searchParams;
  return (
    <NewsletterLinkPage
      title="Unsubscribe"
      intro="Do you want to stop receiving the Auroranexis newsletter? You will not receive any further newsletter emails."
      buttonLabel="Unsubscribe"
      token={token}
      status={status === "ok" || status === "invalid" || status === "error" ? status : undefined}
      action={unsubscribeNewsletterAction}
      messages={{
        ok: "You have been unsubscribed. You will not receive any further newsletter emails from Auroranexis.",
        invalid:
          "This unsubscribe link is invalid. Please use the link in the latest newsletter email, or write to info@auroranexis.com.",
        error: "Something went wrong on our side. Please try again in a few minutes.",
      }}
    />
  );
}
