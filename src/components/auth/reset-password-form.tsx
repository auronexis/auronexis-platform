"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthPasswordInput } from "@/components/auth/auth-password-input";
import { FormAlert } from "@/components/ui/form-alert";
import { AUTH_MESSAGES } from "@/lib/auth/messages";
import {
  updatePasswordAfterResetAction,
  type ResetPasswordActionState,
} from "@/lib/auth/reset-actions";
import { cn } from "@/lib/utils/cn";

const initialState: ResetPasswordActionState = {};

type ResetPasswordFormProps = {
  canReset: boolean;
  sessionError?: string;
};

export function ResetPasswordForm({ canReset, sessionError }: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(updatePasswordAfterResetAction, initialState);
  const blockingError = sessionError ?? (!canReset ? AUTH_MESSAGES.RESET_SESSION_EXPIRED : undefined);

  if (blockingError) {
    return (
      <div className="space-y-4 text-slate-950 [color-scheme:light]">
        <div className="mb-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Reset your password</h1>
        </div>
        <FormAlert variant="error" className="[color-scheme:light]">
          <span role="alert" aria-live="assertive">
            {blockingError}
          </span>
        </FormAlert>
        <p className="text-center text-sm text-slate-600">
          <Link
            href="/forgot-password"
            className="font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 rounded"
          >
            Request a new reset link
          </Link>
        </p>
        <p className="text-center text-sm text-slate-600">
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 rounded"
          >
            Back to login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 text-slate-950 [color-scheme:light]" noValidate>
      <div className="mb-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Choose a new password</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          Create a strong password for your Auroranexis account.
        </p>
      </div>

      <AuthPasswordInput
        name="password"
        label="New password"
        showStrength
        error={state.fieldErrors?.password}
      />
      <AuthPasswordInput
        name="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword}
      />

      {state.error && !state.fieldErrors?.password && !state.fieldErrors?.confirmPassword ? (
        <FormAlert variant="error" className="[color-scheme:light]">
          <span role="alert" aria-live="assertive">
            {state.error}
          </span>
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
        {isPending ? "Updating…" : "Update password"}
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
