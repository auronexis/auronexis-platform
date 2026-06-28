"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { TurnstileField } from "@/components/security/turnstile-field";
import { signUp, type AuthActionState } from "@/lib/auth/actions";

const initialState: AuthActionState = {};

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <Input name="fullName" label="Full name" required placeholder="Jane Smith" />
      <Input
        name="organizationName"
        label="Agency name"
        required
        placeholder="Acme Automation"
      />
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
        autoComplete="new-password"
        required
        placeholder="Minimum 8 characters"
      />
      {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}
      <TurnstileField className="pt-1" />
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent-blue hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
