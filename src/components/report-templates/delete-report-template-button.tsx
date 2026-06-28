"use client";

import { deleteReportTemplateAction } from "@/lib/report-templates/actions";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";

type DeleteReportTemplateButtonProps = {
  templateId: string;
  templateName: string;
};

export function DeleteReportTemplateButton({
  templateId,
  templateName,
}: DeleteReportTemplateButtonProps) {
  return (
    <ConfirmActionButton
      dialogTitle="Delete report template"
      dialogDescription={`Delete template "${templateName}"?`}
      dialogConsequences="Schedules using this template will no longer apply it."
      confirmLabel="Delete template"
      successToast={`"${templateName}" deleted`}
      onConfirm={() => deleteReportTemplateAction(templateId)}
    >
      Delete template
    </ConfirmActionButton>
  );
}
