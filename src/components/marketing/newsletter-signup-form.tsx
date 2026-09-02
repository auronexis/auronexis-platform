"use client";

import { useActionState, useId } from "react";
import Link from "next/link";
import { FormAlert } from "@/components/ui/form-alert";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";
import { LEGAL_ROUTES } from "@/lib/company/company-links";
import {
  MARKETING_CONSENT_PURPOSE,
} from "@/lib/marketing/marketing-consent";
import { submitNewsletterSignup, type CaptureActionState } from "@/lib/sales/capture-actions";

const initialState: CaptureActionState = {};

export function NewsletterSignupForm({ className }: { className?: string }) {
  const [state, formAction, isPending] = useActionState(submitNewsletterSignup, initialState);
  const emailId = useId();
  const consentId = useId();

  if (state.success) {
    return (
      <FormAlert variant="success" className={className}>
        You are subscribed. Welcome to the Auroranexis updates list.
      </FormAlert>
    );
  }

  return (
    <form action={formAction} className={cn("space-y-3", className)} aria-labelledby={`${emailId}-legend`}>
      <p id={`${emailId}-legend`} className="sr-only">
        Newsletter signup
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="min-w-0 flex-1">
          <label htmlFor={emailId} className="sr-only">
            Work email
          </label>
          <input
            id={emailId}
            required
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@agency.com"
            aria-required="true"
            className={cn(
              "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white",
              focusRing,
            )}
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending || undefined}
          className={cn(
            "rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60",
            focusRing,
          )}
        >
          {isPending ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      <label htmlFor={consentId} className="flex cursor-pointer items-start gap-2 text-xs text-white/70">
        <input
          id={consentId}
          type="checkbox"
          name="marketingConsent"
          value="on"
          defaultChecked={false}
          className={cn("mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/[0.04]", focusRing)}
        />
        <span>
          I agree to receive product updates and marketing emails ({MARKETING_CONSENT_PURPOSE}) See{" "}
          <Link href={LEGAL_ROUTES.privacy} className="underline underline-offset-2 hover:text-white">
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}
    </form>
  );
}
