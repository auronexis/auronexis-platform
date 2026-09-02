"use client";

import { useActionState, useId } from "react";
import Link from "next/link";
import { FormAlert } from "@/components/ui/form-alert";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";
import { submitPilotApplication, type CaptureActionState } from "@/lib/sales/capture-actions";
import { MARKETING_ROUTES } from "@/lib/company/contact";
import { LEGAL_ROUTES } from "@/lib/company/company-links";
import { MARKETING_CONSENT_PURPOSE } from "@/lib/marketing/marketing-consent";

const initialState: CaptureActionState = {};

export function PilotApplicationForm({
  className,
  blockedReason,
}: {
  className?: string;
  /** Server-resolved paid-customer block — mirrored by submitPilotApplication. */
  blockedReason?: string | null;
}) {
  const [state, formAction, isPending] = useActionState(submitPilotApplication, initialState);
  const marketingId = useId();

  if (blockedReason) {
    return (
      <FormAlert variant="error" className={className}>
        {blockedReason}{" "}
        <a href={MARKETING_ROUTES.contact} className="underline underline-offset-2">
          Contact sales
        </a>
      </FormAlert>
    );
  }

  if (state.success) {
    return (
      <FormAlert variant="success" className={className}>
        Thank you. Your pilot application has been received. Our sales team will follow up within one business day.
      </FormAlert>
    );
  }

  return (
    <form action={formAction} className={cn("space-y-4", className)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-white">Name</span>
          <input required name="name" autoComplete="name" className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-white">Email</span>
          <input required type="email" name="email" autoComplete="email" className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-white">Company</span>
        <input required name="company" autoComplete="organization" className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-white">Company size</span>
          <input name="companySize" placeholder="e.g. 11–50" className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-white">Industry</span>
          <input name="industry" className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-white">Employees</span>
          <input name="employees" type="number" min={1} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-white">Website</span>
        <input name="website" type="url" autoComplete="url" className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-white">Operations goals & pain points</span>
        <textarea required name="painPoints" rows={4} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-white">Additional notes</span>
        <textarea name="message" rows={3} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
      </label>
      <p className="text-xs text-white/60">
        We use your details to evaluate and respond to this pilot application (service communication). See our{" "}
        <Link href={LEGAL_ROUTES.privacy} className="underline underline-offset-2 hover:text-white">
          Privacy Policy
        </Link>
        .
      </p>
      <label htmlFor={marketingId} className="flex cursor-pointer items-start gap-2 text-xs text-white/70">
        <input
          id={marketingId}
          type="checkbox"
          name="marketingConsent"
          value="on"
          defaultChecked={false}
          className={cn("mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/[0.04]", focusRing)}
        />
        <span>
          Optional: also send me product updates and marketing emails ({MARKETING_CONSENT_PURPOSE})
        </span>
      </label>
      {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}
      <button type="submit" disabled={isPending} className={cn("rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60", focusRing)}>
        {isPending ? "Submitting…" : "Apply for pilot"}
      </button>
    </form>
  );
}
