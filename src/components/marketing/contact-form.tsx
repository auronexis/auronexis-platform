"use client";
import { TurnstileField } from "@/components/security/turnstile-field";

import { useId } from "react";
import Link from "next/link";
import { FormAlert } from "@/components/ui/form-alert";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";
import { LEGAL_ROUTES } from "@/lib/company/company-links";
import { MARKETING_CONSENT_PURPOSE } from "@/lib/marketing/marketing-consent";
import { submitContactForm } from "@/lib/marketing/contact-action";
import {
  buildFallbackMailto,
  useResilientFormAction,
} from "@/components/marketing/use-resilient-form-action";

type ContactFormProps = {
  className?: string;
};

export function ContactForm({ className }: ContactFormProps) {
  const [state, formAction, isPending] = useResilientFormAction(submitContactForm);
  const marketingId = useId();
  const values = state.values ?? {};

  if (state.success) {
    return (
      <FormAlert variant="success" className={className}>
        Thank you. Your message has been received. Our team will follow up by email.
      </FormAlert>
    );
  }

  return (
    <form key={state.attempt} action={formAction} className={cn("space-y-4", className)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Name</span>
          <input
            required
            name="name"
            autoComplete="name"
            defaultValue={values.name}
            className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Email</span>
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            defaultValue={values.email}
            className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-foreground">Company</span>
        <input
          name="company"
          autoComplete="organization"
          defaultValue={values.company}
          className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-foreground">Message</span>
        <textarea
          required
          name="message"
          rows={5}
          defaultValue={values.message}
          className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
        />
      </label>
      <p className="text-xs text-muted">
        We use your details only to respond to this inquiry. See our{" "}
        <Link href={LEGAL_ROUTES.privacy} className="underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
      <label htmlFor={marketingId} className="flex cursor-pointer items-start gap-2 text-xs text-muted">
        <input
          id={marketingId}
          type="checkbox"
          name="marketingConsent"
          value="on"
          defaultChecked={false}
          className={cn("mt-0.5 h-4 w-4 shrink-0 rounded border-border bg-surface-1", focusRing)}
        />
        <span>Optional: {MARKETING_CONSENT_PURPOSE} You can unsubscribe at any time.</span>
      </label>
      {state.error ? (
        <FormAlert variant="error">
          {state.error}
          {state.unreachable ? (
            <>
              {" "}
              <a
                href={buildFallbackMailto("Contact request", values)}
                className="font-medium underline underline-offset-2"
              >
                Send by email instead
              </a>
            </>
          ) : null}
        </FormAlert>
      ) : null}
      <TurnstileField action="contact" resetKey={state} className="pt-1" />
      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60",
          focusRing,
        )}
      >
        {isPending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
