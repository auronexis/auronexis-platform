"use client";

import { useActionState } from "react";
import { TurnstileField } from "@/components/security/turnstile-field";
import { FormAlert } from "@/components/ui/form-alert";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";
import { submitPilotApplication, type CaptureActionState } from "@/lib/sales/capture-actions";

const initialState: CaptureActionState = {};

export function PilotApplicationForm({ className }: { className?: string }) {
  const [state, formAction, isPending] = useActionState(submitPilotApplication, initialState);

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
          <input required name="name" className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-white">Email</span>
          <input required type="email" name="email" className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-white">Company</span>
        <input required name="company" className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
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
        <input name="website" type="url" className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-white">Operations goals & pain points</span>
        <textarea required name="painPoints" rows={4} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-white">Additional notes</span>
        <textarea name="message" rows={3} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
      </label>
      {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}
      <TurnstileField />
      <button type="submit" disabled={isPending} className={cn("rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60", focusRing)}>
        {isPending ? "Submitting…" : "Apply for pilot"}
      </button>
    </form>
  );
}
