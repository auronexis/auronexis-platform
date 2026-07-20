"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { inputClassName, labelClassName } from "@/components/auth/auth-password-input";
import { FormAlert } from "@/components/ui/form-alert";
import {
  requestPasswordResetAction,
  type ForgotPasswordActionState,
} from "@/lib/auth/reset-actions";
import { cn } from "@/lib/utils/cn";

const initialState: ForgotPasswordActionState = {};
const CLIENT_COOLDOWN_SECONDS = 30;

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, initialState);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (state.success || state.retryAfterSeconds) {
      setCooldownSeconds(state.retryAfterSeconds ?? CLIENT_COOLDOWN_SECONDS);
    }
  }, [state.success, state.retryAfterSeconds]);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const isSubmitDisabled = isPending || cooldownSeconds > 0;
  const showSuccess = Boolean(state.success);

  return (
    <form action={formAction} className="space-y-4 text-slate-950 [color-scheme:light]" noValidate>
      <div className="mb-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Reset your password</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          Enter your email and we&apos;ll send reset instructions if an account exists.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className={labelClassName}>
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@agency.com"
          className={inputClassName}
          disabled={showSuccess}
          aria-describedby={state.error ? "forgot-password-error" : undefined}
        />
      </div>

      {state.error ? (
        <FormAlert variant="error" className="[color-scheme:light]">
          <span id="forgot-password-error" aria-live="assertive">
            {state.error}
          </span>
        </FormAlert>
      ) : null}

      {showSuccess ? (
        <FormAlert variant="success" className="[color-scheme:light]">
          <span aria-live="polite" role="status">
            {state.success}
          </span>
        </FormAlert>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitDisabled || showSuccess}
        aria-busy={isPending}
        className={cn(
          "inline-flex h-10 w-full items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white",
          "hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {isPending
          ? "Sending…"
          : cooldownSeconds > 0
            ? `Try again in ${cooldownSeconds}s`
            : showSuccess
              ? "Email sent"
              : "Send reset instructions"}
      </button>

      <p className="text-center text-sm text-slate-600">
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 rounded"
        >
          Back to login
        </Link>
      </p>
    </form>
  );
}
