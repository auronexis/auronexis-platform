"use client";

import { deleteEscalationRuleAction } from "@/lib/escalation/actions";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";

type DeleteEscalationRuleButtonProps = {
  ruleId: string;
  ruleName: string;
};

export function DeleteEscalationRuleButton({ ruleId, ruleName }: DeleteEscalationRuleButtonProps) {
  return (
    <ConfirmActionButton
      dialogTitle="Delete escalation rule"
      dialogDescription={`Delete escalation rule "${ruleName}"?`}
      dialogConsequences="This action cannot be undone."
      confirmLabel="Delete rule"
      successToast={`"${ruleName}" deleted`}
      onConfirm={async () => {
        await deleteEscalationRuleAction(ruleId);
      }}
    >
      Delete rule
    </ConfirmActionButton>
  );
}
