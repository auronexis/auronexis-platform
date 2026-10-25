import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

type Status = "ok" | "invalid" | "error" | undefined;

type NewsletterLinkPageProps = {
  title: string;
  intro: string;
  buttonLabel: string;
  token: string | undefined;
  status: Status;
  action: (formData: FormData) => Promise<void>;
  messages: { ok: string; invalid: string; error: string };
};

/** Shared page for newsletter confirm / unsubscribe links: explicit button, then a result message. */
export function NewsletterLinkPage({
  title,
  intro,
  buttonLabel,
  token,
  status,
  action,
  messages,
}: NewsletterLinkPageProps) {
  const message = status ? messages[status] : null;

  return (
    <MarketingShell>
      <section className="mx-auto max-w-xl px-6 py-20 sm:py-28">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
        {message ? (
          <p className="mt-6 text-base leading-relaxed text-primary-foreground/85" role="status">
            {message}
          </p>
        ) : token ? (
          <>
            <p className="mt-6 text-base leading-relaxed text-primary-foreground/85">{intro}</p>
            <form action={action} className="mt-8">
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                className={cn(
                  "rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground",
                  focusRing,
                )}
              >
                {buttonLabel}
              </button>
            </form>
          </>
        ) : (
          <p className="mt-6 text-base leading-relaxed text-primary-foreground/85">{messages.invalid}</p>
        )}
        <p className="mt-10 text-sm">
          <Link href="/" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
            Back to auroranexis.com
          </Link>
        </p>
      </section>
    </MarketingShell>
  );
}
