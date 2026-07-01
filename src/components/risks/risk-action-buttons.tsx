"use client";

import { useTransition } from "react";
import {
  acknowledgeRiskAction,
  dismissRiskAction,
  mitigateRiskAction,
  resolveRiskAction,
} from "@/lib/risks/actions";
import type { RiskStatus } from "@/lib/risks/types";
import { Button } from "@/components/ui/button";

type RiskActionButtonsProps = {
  riskId: string;
  status: RiskStatus;
  canManage: boolean;
};

export function RiskActionButtons({ riskId, status, canManage }: RiskActionButtonsProps) {
  const [pending, startTransition] = useTransition();

  if (!canManage) {
    return null;
  }

  const run = (action: (id: string) => Promise<{ error?: string }>) => {
    startTransition(async () => {
      await action(riskId);
      window.location.reload();
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {status === "open" ? (
        <Button type="button" variant="secondary" disabled={pending} onClick={() => run(acknowledgeRiskAction)}>
          Acknowledge
        </Button>
      ) : null}
      {status === "open" || status === "acknowledged" ? (
        <Button type="button" variant="secondary" disabled={pending} onClick={() => run(mitigateRiskAction)}>
          Mitigate
        </Button>
      ) : null}
      {status !== "resolved" && status !== "dismissed" ? (
        <>
          <Button type="button" disabled={pending} onClick={() => run(resolveRiskAction)}>
            Resolve
          </Button>
          <Button type="button" variant="secondary" disabled={pending} onClick={() => run(dismissRiskAction)}>
            Dismiss
          </Button>
        </>
      ) : null}
    </div>
  );
}
