"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setDefaultSlaPolicyAction } from "@/lib/sla/actions";

type SetDefaultSlaPolicyButtonProps = {
  policyId: string;
  policyName: string;
  isDefault: boolean;
};

export function SetDefaultSlaPolicyButton({
  policyId,
  policyName,
  isDefault,
}: SetDefaultSlaPolicyButtonProps) {
  const [isPending, startTransition] = useTransition();

  if (isDefault) {
    return (
      <p className="text-sm text-muted">
        {policyName} is the organization default SLA policy.
      </p>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await setDefaultSlaPolicyAction(policyId);
        });
      }}
    >
      {isPending ? "Setting default…" : "Set as default"}
    </Button>
  );
}
