"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createPortalUserAction,
  type PortalUserActionState,
} from "@/lib/client-portal/actions";

type CreatePortalUserFormProps = {
  clientId: string;
};

const initialState: PortalUserActionState = {};

export function CreatePortalUserForm({ clientId }: CreatePortalUserFormProps) {
  const [state, formAction, isPending] = useActionState(createPortalUserAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="clientId" value={clientId} />
      <Input name="fullName" label="Full name" required placeholder="Jane Client" autoComplete="name" />
      <Input
        name="email"
        type="email"
        label="Email"
        required
        placeholder="jane@client.com"
        autoComplete="email"
      />
      <Input
        name="password"
        type="password"
        label="Initial password"
        required
        placeholder="Minimum 8 characters"
        autoComplete="new-password"
      />
      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-critical">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating…" : "Create portal user"}
      </Button>
    </form>
  );
}
