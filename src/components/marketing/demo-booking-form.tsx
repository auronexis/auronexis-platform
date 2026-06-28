"use client";

import { useActionState } from "react";
import { TurnstileField } from "@/components/security/turnstile-field";
import { FormAlert } from "@/components/ui/form-alert";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";
import { submitDemoRequest, type CaptureActionState } from "@/lib/sales/capture-actions";

const initialState: CaptureActionState = {};

export function DemoBookingForm({ className }: { className?: string }) {
  const [state, formAction, isPending] = useActionState(submitDemoRequest, initialState);

  if (state.success) {
    return (
      <FormAlert variant="success" className={className}>
        Demo request received. We will send a calendar link for discovery scheduling shortly.
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
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-white">What would you like to see?</span>
        <textarea name="message" rows={4} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
      </label>
      {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}
      <TurnstileField />
      <button type="submit" disabled={isPending} className={cn("rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60", focusRing)}>
        {isPending ? "Submitting…" : "Book demo"}
      </button>
    </form>
  );
}
