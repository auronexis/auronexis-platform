import type { Metadata } from "next";
import { createPrivateAppMetadata } from "@/lib/seo/metadata";
import { NewsletterLinkPage } from "@/components/marketing/newsletter-link-page";
import { confirmNewsletterAction } from "@/lib/newsletter/actions";

export const dynamic = "force-dynamic";

/** Personal link pages: never indexed (createPrivateAppMetadata sets noindex, nofollow). */
export const metadata: Metadata = createPrivateAppMetadata("Confirm your subscription");

type PageProps = { searchParams: Promise<{ token?: string; status?: string }> };

export default async function NewsletterConfirmPage({ searchParams }: PageProps) {
  const { token, status } = await searchParams;
  return (
    <NewsletterLinkPage
      title="Confirm your subscription"
      intro="Please confirm that you want to receive product updates and occasional news from Auroranexis. You can unsubscribe at any time with the link in every email."
      buttonLabel="Confirm subscription"
      token={token}
      status={status === "ok" || status === "invalid" || status === "error" ? status : undefined}
      action={confirmNewsletterAction}
      messages={{
        ok: "Thank you. Your subscription is confirmed.",
        invalid:
          "This confirmation link is invalid or has expired. Please sign up again on auroranexis.com to receive a new link.",
        error: "Something went wrong on our side. Please try again in a few minutes.",
      }}
    />
  );
}
