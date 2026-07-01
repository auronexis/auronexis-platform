"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FormAlert } from "@/components/ui/form-alert";
import { TurnstileField } from "@/components/security/turnstile-field";
import { signIn, type AuthActionState } from "@/lib/auth/actions";
import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { cn } from "@/lib/utils/cn";

const initialState: AuthActionState = {};

const labelClassName = "block text-sm font-medium text-slate-700";
const inputClassName = cn(
  "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-xs",
  "placeholder:text-slate-400",
  "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

type LoginFormProps = {
  redirectTo?: string;
  initialError?: string;
};

export function LoginForm({ redirectTo, initialError }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(signIn, initialState);
  const [logoFailed, setLogoFailed] = useState(false);
  const errorMessage = state.error ?? initialError;

  return (
    <form action={formAction} className="space-y-4 text-slate-950 [color-scheme:light]">
      {redirectTo ? <input type="hidden" name="redirect" value={redirectTo} /> : null}
      <div className="mb-8 text-center">
        {logoFailed ? (
          <div className="text-2xl font-bold tracking-tight text-slate-950">Auroranexis</div>
        ) : (
          <img
            src={BRANDING_ASSETS.logoHorizontalOnLight}
            alt="Auroranexis"
            className="mx-auto h-10 w-auto max-h-12 max-w-[240px] object-contain opacity-100"
            onError={() => setLogoFailed(true)}
          />
        )}
        <p className="mt-3 text-base leading-relaxed text-slate-700">
          Monitor clients.
          <br />
          Detect risks.
          <br />
          Prove value.
        </p>
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
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className={inputClassName}
        />
      </div>
      {errorMessage ? <FormAlert variant="error">{errorMessage}</FormAlert> : null}
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
