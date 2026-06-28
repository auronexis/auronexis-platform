"use client";

import { markReportSentAction } from "@/lib/reports/actions";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";

type MarkReportSentButtonProps = {
  reportId: string;
  reportTitle: string;
};

export function MarkReportSentButton({ reportId, reportTitle }: MarkReportSentButtonProps) {
  return (
    <ConfirmActionButton
      variant="primary"
      dialogTitle="Mark report sent"
      dialogDescription={`Mark "${reportTitle}" as sent?`}
      confirmLabel="Mark sent"
      successToast={`"${reportTitle}" marked sent`}
      onConfirm={() => markReportSentAction(reportId)}
    >
      Mark Sent
    </ConfirmActionButton>
  );
}
