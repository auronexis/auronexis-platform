"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { RiskActionState } from "@/lib/risks/actions";

type AcceptRiskButtonProps = {
  riskId: string;
  action: (riskId: string) => Promise<RiskActionState>;
};

export function AcceptRiskButton({ riskId, action }: AcceptRiskButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={isPending}
      loading={isPending}
      loadingText="Accepting…"
      onClick={() => {
        startTransition(async () => {
          await action(riskId);
        });
      }}
    >
      Accept risk
    </Button>
  );
}
