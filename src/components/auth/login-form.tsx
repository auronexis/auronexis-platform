"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormAlert } from "@/components/ui/form-alert";
import { TurnstileField } from "@/components/security/turnstile-field";
import { signIn, type AuthActionState } from "@/lib/auth/actions";
import { cn } from "@/lib/utils/cn";

const initialState: AuthActionState = {};

const labelClassName = "block text-sm font-medium text-slate-700";
const inputClassName = cn(
  "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-xs",
  "placeholder:text-slate-400",
  "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4 text-slate-950 [color-scheme:light]">
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
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className={inputClassName}
        />
      </div>
      {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}
      <TurnstileField className="pt-1" />
      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "inline-flex h-10 w-full items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white",
          "hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-slate-600">
        New agency?{" "}
        <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-700">
          Create account
        </Link>
      </p>
    </form>
  );
}
