"use client";

import { useActionState, useEffect } from "react";
import { FormAlert } from "@/components/ui/form-alert";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import { cn } from "@/lib/utils/cn";
import { submitDemoRequest, type CaptureActionState } from "@/lib/sales/capture-actions";

const initialState: CaptureActionState = {};

export function DemoBookingForm({ className }: { className?: string }) {
  const [state, formAction, isPending] = useActionState(submitDemoRequest, initialState);

  useEffect(() => {
    if (state.success) {
      trackAnalyticsEvent("demo_requested", { source: "demo_booking_form" });
    }
  }, [state.success]);

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
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-white">What would you like to see?</span>
        <textarea name="message" rows={4} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
      </label>
      {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}
      <MarketingButton type="submit" loading={isPending} ctaId="book_demo" analyticsEvent="demo_requested">
        Book demo
      </MarketingButton>
    </form>
  );
}
