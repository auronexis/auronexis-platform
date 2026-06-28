"use client";

import { archiveReportAction } from "@/lib/reports/actions";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";

type ArchiveReportButtonProps = {
  reportId: string;
  reportTitle: string;
};

export function ArchiveReportButton({ reportId, reportTitle }: ArchiveReportButtonProps) {
  return (
    <ConfirmActionButton
      dialogTitle="Archive report"
      dialogDescription={`Archive "${reportTitle}"? It will be hidden from the active report list.`}
      confirmLabel="Archive report"
      successToast={`"${reportTitle}" archived`}
      onConfirm={() => archiveReportAction(reportId)}
    >
      Archive report
    </ConfirmActionButton>
  );
}
