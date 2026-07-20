"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/ui/form-alert";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";
import { submitReferralLead, type CaptureActionState } from "@/lib/sales/capture-actions";

const initialState: CaptureActionState = {};

export function ReferralLeadForm({ className }: { className?: string }) {
  const [state, formAction, isPending] = useActionState(submitReferralLead, initialState);

  if (state.success) {
    return (
      <FormAlert variant="success" className={className}>
        Referral received. Our sales team will follow up shortly.
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
        <span className="mb-1 block font-medium text-white">Referral code</span>
        <input required name="referralCode" autoComplete="off" className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-white">Company (optional)</span>
        <input name="company" autoComplete="organization" className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
      </label>
      {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}
      <button type="submit" disabled={isPending} className={cn("rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60", focusRing)}>
        {isPending ? "Submitting…" : "Submit referral"}
      </button>
    </form>
  );
}
