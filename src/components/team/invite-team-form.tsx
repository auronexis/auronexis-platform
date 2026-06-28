"use client";

import { useActionState } from "react";
import { SeatLimitWarning } from "@/components/seats/seat-limit-warning";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter, FormRoot, FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import { Select } from "@/components/ui/select";
import {
  inviteTeamMemberAction,
  type TeamActionState,
} from "@/lib/team/actions";
import { INVITE_ROLE_LABELS, type InviteRole } from "@/lib/team/types";
import { useFormActionFeedback } from "@/lib/ui/use-form-action-feedback";

type InviteTeamFormProps = {
  invitableRoles: InviteRole[];
  seatBlocked?: boolean;
  seatBlockedMessage?: string;
};

const initialState: TeamActionState = {};

export function InviteTeamForm({
  invitableRoles,
  seatBlocked = false,
  seatBlockedMessage,
}: InviteTeamFormProps) {
  const [state, formAction, isPending] = useActionState(inviteTeamMemberAction, initialState);

  useFormActionFeedback(state, isPending);

  return (
    <PageSurface>
      <PageSurfaceHeading
        title="Invite team member"
        description="Invitations expire after 7 days. Share the acceptance link manually — email is not sent in v1."
      />

      {seatBlocked && seatBlockedMessage ? (
        <div className="mb-4">
          <SeatLimitWarning message={seatBlockedMessage} />
        </div>
      ) : null}

      <form action={formAction}>
        <FormRoot>
          <FormSection title="Invitation details">
            <Input
              name="email"
              type="email"
              label="Email"
              required
              placeholder="colleague@agency.com"
            />
            <Select
              id="role"
              name="role"
              label="Role"
              required
              defaultValue={invitableRoles[0]}
              options={invitableRoles.map((role) => ({
                value: role,
                label: INVITE_ROLE_LABELS[role],
              }))}
            />
          </FormSection>

          {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}

          {state.inviteUrl ? (
            <div className="rounded-lg border border-border bg-muted/5 px-3 py-2.5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                Acceptance link
              </p>
              <p className="mt-1 break-all text-sm text-foreground">{state.inviteUrl}</p>
            </div>
          ) : null}

          <FormFooter>
            <Button
              type="submit"
              disabled={isPending || seatBlocked}
              loading={isPending}
              loadingText="Creating invitation…"
            >
              Create invitation
            </Button>
          </FormFooter>
        </FormRoot>
      </form>
    </PageSurface>
  );
}
