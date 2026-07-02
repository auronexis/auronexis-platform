"use client";

import { useActionState } from "react";
import { ProfileField, ProfileReadOnlyValue } from "@/components/profile/profile-section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateAccountEmailAction, type ProfileActionState } from "@/lib/profile/actions";

type AccountEmailSectionProps = {
  currentEmail: string;
};

const initialState: ProfileActionState = {};

export function AccountEmailSection({ currentEmail }: AccountEmailSectionProps) {
  const [state, formAction, isPending] = useActionState(updateAccountEmailAction, initialState);

  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-muted/5 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Email address</p>
        <p className="mt-1 text-xs text-muted">Sign-in email for your Auroranexis account.</p>
      </div>

      <ProfileField label="Current email">
        <ProfileReadOnlyValue value={currentEmail} />
      </ProfileField>

      {state.error ? (
        <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-sm text-success" role="status">
          {state.success}
        </p>
      ) : null}

      <form action={formAction} className="space-y-3">
        <Input
          name="email"
          type="email"
          label="New email address"
          placeholder="you@company.com"
          autoComplete="email"
          required
        />
        <p className="text-xs text-muted">
          Supabase may send confirmation links to your new and current email addresses before the change
          takes effect.
        </p>
        <Button type="submit" size="sm" loading={isPending}>
          Request email change
        </Button>
      </form>
    </div>
  );
}
