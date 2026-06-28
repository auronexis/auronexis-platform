"use client";

import { setDefaultReportTemplateAction } from "@/lib/report-templates/actions";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";

type SetDefaultTemplateButtonProps = {
  templateId: string;
  templateName: string;
  isDefault: boolean;
};

export function SetDefaultTemplateButton({
  templateId,
  templateName,
  isDefault,
}: SetDefaultTemplateButtonProps) {
  if (isDefault) {
    return (
      <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
        Organization default
      </span>
    );
  }

  return (
    <ConfirmActionButton
      variant="secondary"
      dialogTitle="Set default template"
      dialogDescription={`Set "${templateName}" as the default report template?`}
      confirmLabel="Set as default"
      successToast={`"${templateName}" set as default`}
      onConfirm={() => setDefaultReportTemplateAction(templateId)}
    >
      Set as default
    </ConfirmActionButton>
  );
}
