"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
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
  const { toast } = useToast();

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
          const result = await setDefaultSlaPolicyAction(policyId);
          if (result.error) {
            toast({ title: result.error, variant: "error" });
            return;
          }
          if (result.success) {
            toast({ title: result.success, variant: "success" });
          }
        });
      }}
    >
      {isPending ? "Setting default…" : "Set as default"}
    </Button>
  );
}
