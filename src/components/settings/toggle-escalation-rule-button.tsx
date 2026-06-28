"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleEscalationRuleAction } from "@/lib/escalation/actions";

type ToggleEscalationRuleButtonProps = {
  ruleId: string;
  enabled: boolean;
};

export function ToggleEscalationRuleButton({ ruleId, enabled }: ToggleEscalationRuleButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={enabled ? "secondary" : "primary"}
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await toggleEscalationRuleAction(ruleId, !enabled);
        });
      }}
    >
      {isPending ? "Saving…" : enabled ? "Disable rule" : "Enable rule"}
    </Button>
  );
}
