"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { FormAlert } from "@/components/ui/form-alert";
import {
  setTeamMemberStatusAction,
  updateTeamMemberRoleAction,
  type TeamActionState,
} from "@/lib/team/actions";
import { USER_ROLE_LABELS, type TeamMemberView } from "@/lib/team/types";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";
import { useFormActionFeedback } from "@/lib/ui/use-form-action-feedback";
import { cn } from "@/lib/utils/cn";
import type { UserRole } from "@/types/database";

type TeamMemberActionsProps = {
  member: TeamMemberView;
  assignableRoles: UserRole[];
  canManage: boolean;
};

const initialState: TeamActionState = {};

export function TeamMemberActions({
  member,
  assignableRoles,
  canManage,
}: TeamMemberActionsProps) {
  const [state, formAction, isPending] = useActionState(updateTeamMemberRoleAction, initialState);
  const router = useRouter();

  useFormActionFeedback(state, isPending);

  if (!canManage) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="userId" value={member.id} />
        <select
          name="role"
          defaultValue={member.role}
          className={cn(
            "h-9 cursor-pointer rounded-md border border-border bg-surface px-2 text-sm text-foreground shadow-xs",
            transitionInteractive,
            focusRing,
          )}
        >
          {assignableRoles.map((role) => (
            <option key={role} value={role}>
              {USER_ROLE_LABELS[role]}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          variant="secondary"
          disabled={isPending}
          loading={isPending}
          loadingText="Saving…"
          className="h-9 px-3"
        >
          Update role
        </Button>
      </form>
      <ConfirmActionButton
        variant={member.is_disabled ? "primary" : "danger"}
        className="h-9 px-3"
        dialogTitle={member.is_disabled ? "Reactivate team member" : "Disable team member"}
        dialogDescription={`${member.is_disabled ? "Reactivate" : "Disable"} ${member.full_name}?`}
        confirmLabel={member.is_disabled ? "Reactivate" : "Disable"}
        successToast={
          member.is_disabled ? `${member.full_name} reactivated` : `${member.full_name} disabled`
        }
        onConfirm={async () => {
          await setTeamMemberStatusAction(member.id, !member.is_disabled);
          router.refresh();
        }}
      >
        {member.is_disabled ? "Reactivate" : "Disable"}
      </ConfirmActionButton>
      {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}
    </div>
  );
}
