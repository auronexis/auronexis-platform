"use client";

import { generateReportDraftAction } from "@/lib/report-schedules/actions";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";

type GenerateReportDraftButtonProps = {
  scheduleId: string;
};

export function GenerateReportDraftButton({ scheduleId }: GenerateReportDraftButtonProps) {
  return (
    <ConfirmActionButton
      variant="primary"
      dialogTitle="Generate draft report"
      dialogDescription="Generate a draft report from this schedule now?"
      confirmLabel="Generate draft"
      successToast="Draft report generated"
      onConfirm={() => generateReportDraftAction(scheduleId)}
    >
      Generate draft now
    </ConfirmActionButton>
  );
}
