"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import {
  acceptInvitationAction,
  type AcceptInviteActionState,
} from "@/lib/team/actions";

type AcceptInviteFormProps = {
  token: string;
  email: string;
  organizationName: string;
  roleLabel: string;
};

const initialState: AcceptInviteActionState = {};

export function AcceptInviteForm({
  token,
  email,
  organizationName,
  roleLabel,
}: AcceptInviteFormProps) {
  const [state, formAction, isPending] = useActionState(acceptInvitationAction, initialState);

  return (
    <div>
      <div className="mb-6 rounded-md border border-border-subtle bg-surface-2 px-4 py-3 text-sm text-secondary">
        <p>
          You&apos;ve been invited to join <strong className="text-navy-950">{organizationName}</strong>{" "}
          as <strong className="text-navy-950">{roleLabel}</strong>.
        </p>
        <p className="mt-1">Email: {email}</p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <Input name="fullName" label="Full name" required placeholder="Jane Smith" autoComplete="name" />
        <Input
          name="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          required
          placeholder="Minimum 8 characters"
        />
        {state.error ? (
          <FormAlert variant="error" className="[color-scheme:light]">
            {state.error}
          </FormAlert>
        ) : null}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating account…" : "Accept invitation"}
        </Button>
      </form>
    </div>
  );
}
