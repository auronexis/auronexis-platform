"use client";

import { useActionState } from "react";
import { TurnstileField } from "@/components/security/turnstile-field";
import { FormAlert } from "@/components/ui/form-alert";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";
import { submitContactForm, type ContactActionState } from "@/lib/marketing/contact-action";

type ContactFormProps = {
  className?: string;
};

const initialState: ContactActionState = {};

export function ContactForm({ className }: ContactFormProps) {
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState);

  if (state.success) {
    return (
      <FormAlert variant="success" className={className}>
        Thank you. Your message has been received. A team member will follow up via email during
        the pilot program.
      </FormAlert>
    );
  }

  return (
    <form action={formAction} className={cn("space-y-4", className)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Name</span>
          <input
            required
            name="name"
            className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Email</span>
          <input
            required
            type="email"
            name="email"
            className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-foreground">Company</span>
        <input
          name="company"
          className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-foreground">Message</span>
        <textarea
          required
          name="message"
          rows={5}
          className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
        />
      </label>
      {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}
      <TurnstileField />
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
