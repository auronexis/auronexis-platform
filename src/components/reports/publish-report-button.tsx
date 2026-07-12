"use client";

import { publishReportAction } from "@/lib/reports/actions";
import { trackProductEvent } from "@/lib/analytics/events";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";

type PublishReportButtonProps = {
  reportId: string;
  reportTitle: string;
};

export function PublishReportButton({ reportId, reportTitle }: PublishReportButtonProps) {
  return (
    <ConfirmActionButton
      variant="primary"
      dialogTitle="Publish to client portal"
      dialogDescription={`Publish "${reportTitle}" to the client portal?`}
      dialogConsequences="Clients will be able to view this report."
      confirmLabel="Publish"
      successToast={`"${reportTitle}" published`}
      onConfirm={async () => {
        await publishReportAction(reportId);
        trackProductEvent("report_published", { surface: "report_detail" });
      }}
    >
      Publish to Client Portal
    </ConfirmActionButton>
  );
}
