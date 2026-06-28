"use client";

import { archiveRiskAction } from "@/lib/risks/actions";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";

type ArchiveRiskButtonProps = {
  riskId: string;
  riskTitle: string;
};

export function ArchiveRiskButton({ riskId, riskTitle }: ArchiveRiskButtonProps) {
  return (
    <ConfirmActionButton
      dialogTitle="Archive risk"
      dialogDescription={`Archive "${riskTitle}"? It will be hidden from the active risk list.`}
      confirmLabel="Archive risk"
      successToast={`"${riskTitle}" archived`}
      onConfirm={() => archiveRiskAction(riskId)}
    >
      Archive risk
    </ConfirmActionButton>
  );
}
