"use client";

import { deleteSlaPolicyAction } from "@/lib/sla/actions";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";

type DeleteSlaPolicyButtonProps = {
  policyId: string;
  policyName: string;
};

export function DeleteSlaPolicyButton({ policyId, policyName }: DeleteSlaPolicyButtonProps) {
  return (
    <ConfirmActionButton
      dialogTitle="Delete SLA policy"
      dialogDescription={`Delete SLA policy "${policyName}"?`}
      dialogConsequences="Clients using this policy will fall back to the default."
      confirmLabel="Delete policy"
      successToast={`"${policyName}" deleted`}
      onConfirm={async () => {
        await deleteSlaPolicyAction(policyId);
      }}
    >
      Delete policy
    </ConfirmActionButton>
  );
}
