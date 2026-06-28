"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { TurnstileField } from "@/components/security/turnstile-field";
import { signIn, type AuthActionState } from "@/lib/auth/actions";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <Input
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        placeholder="you@agency.com"
      />
      <Input
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        required
        placeholder="••••••••"
      />
      {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}
      <TurnstileField className="pt-1" />
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted">
        New agency?{" "}
        <Link href="/signup" className="font-medium text-accent-blue hover:underline">
          Create account
        </Link>
      </p>
    </form>
  );
}
