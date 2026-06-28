"use client";

import { markReportReadyAction } from "@/lib/reports/actions";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";

type MarkReportReadyButtonProps = {
  reportId: string;
  reportTitle: string;
};

export function MarkReportReadyButton({ reportId, reportTitle }: MarkReportReadyButtonProps) {
  return (
    <ConfirmActionButton
      variant="primary"
      dialogTitle="Mark report ready"
      dialogDescription={`Mark "${reportTitle}" as ready for internal review?`}
      confirmLabel="Mark ready"
      successToast={`"${reportTitle}" marked ready`}
      onConfirm={() => markReportReadyAction(reportId)}
    >
      Mark Ready
    </ConfirmActionButton>
  );
}
