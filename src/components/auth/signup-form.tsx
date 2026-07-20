"use client";

import Link from "next/link";
import { useActionState } from "react";
import { inputClassName, labelClassName } from "@/components/auth/auth-password-input";
import { FormAlert } from "@/components/ui/form-alert";
import { signUp, type AuthActionState } from "@/lib/auth/actions";
import { markPendingAnalyticsEvent } from "@/lib/analytics/pending-events";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import { cn } from "@/lib/utils/cn";

const initialState: AuthActionState = {};

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  return (
    <form
      action={formAction}
      className="space-y-4 text-slate-950 [color-scheme:light]"
      onSubmit={() => {
        trackAnalyticsEvent("signup_started", { surface: "signup_form" });
        markPendingAnalyticsEvent("signup_completed", { surface: "signup_form" });
        markPendingAnalyticsEvent("workspace_created", { surface: "signup_form" });
      }}
    >
      <div className="mb-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Create your agency</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          Create a free workspace to explore the platform, then choose a paid plan when you are ready
          to scale.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="fullName" className={labelClassName}>
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          placeholder="Jane Smith"
          className={inputClassName}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="organizationName" className={labelClassName}>
          Agency name
        </label>
        <input
          id="organizationName"
          name="organizationName"
          type="text"
          autoComplete="organization"
          required
          placeholder="Acme Automation"
          className={inputClassName}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className={labelClassName}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@agency.com"
          className={inputClassName}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className={labelClassName}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Minimum 8 characters"
          className={inputClassName}
        />
      </div>

      {state.error ? (
        <FormAlert variant="error" className="[color-scheme:light]">
          <span aria-live="assertive">{state.error}</span>
        </FormAlert>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className={cn(
          "inline-flex h-10 w-full items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white",
          "hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {isPending ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 rounded"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
