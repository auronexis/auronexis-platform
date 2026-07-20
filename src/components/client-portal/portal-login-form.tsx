"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormAlert } from "@/components/ui/form-alert";
import { markPendingAnalyticsEvent } from "@/lib/analytics/pending-events";
import { signInPortal, type PortalAuthActionState } from "@/lib/client-portal/actions";

const initialState: PortalAuthActionState = {};

export function PortalLoginForm() {
  const [state, formAction, isPending] = useActionState(signInPortal, initialState);

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={() =>
        markPendingAnalyticsEvent("portal_login", {
          surface: "portal_login",
          module: "portal",
        })
      }
    >
      <Input
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        placeholder="you@company.com"
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
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Signing in…" : "Sign in to portal"}
      </Button>
    </form>
  );
}
