"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter, FormRoot, FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ReportTemplateActionState } from "@/lib/report-templates/actions";
import type { ReportTemplateListItem } from "@/lib/report-templates/types";
import { useFormActionFeedback } from "@/lib/ui/use-form-action-feedback";

type ReportTemplateFormProps = {
  action: (
    prevState: ReportTemplateActionState,
    formData: FormData,
  ) => Promise<ReportTemplateActionState>;
  template?: ReportTemplateListItem;
  submitLabel: string;
  pendingLabel: string;
};

const initialState: ReportTemplateActionState = {};

export function ReportTemplateForm({
  action,
  template,
  submitLabel,
  pendingLabel,
}: ReportTemplateFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  useFormActionFeedback(state, isPending);

  return (
    <form action={formAction}>
      <FormRoot>
        <FormSection title="General" description="Template identity and usage notes.">
          <Input
            name="name"
            label="Template name"
            required
            defaultValue={template?.name ?? ""}
            placeholder="Standard Executive Report"
          />
          <Textarea
            id="description"
            name="description"
            label="Description"
            rows={2}
            defaultValue={template?.description ?? ""}
            placeholder="Optional notes about when to use this template."
          />
        </FormSection>

        <FormSection title="Content templates" description="Default section content for new reports.">
          <Textarea
            id="executiveSummaryTemplate"
            name="executiveSummaryTemplate"
            label="Executive summary template"
            rows={4}
            defaultValue={template?.executive_summary_template ?? ""}
            placeholder="Default executive summary content for new reports."
          />
          <Textarea
            id="keyWinsTemplate"
            name="keyWinsTemplate"
            label="Key wins template"
            rows={3}
            defaultValue={template?.key_wins_template ?? ""}
            placeholder="Default key wins content."
          />
          <Textarea
            id="keyRisksTemplate"
            name="keyRisksTemplate"
            label="Key risks template"
            rows={3}
            defaultValue={template?.key_risks_template ?? ""}
            placeholder="Default key risks content."
          />
          <Textarea
            id="nextActionsTemplate"
            name="nextActionsTemplate"
            label="Next actions template"
            rows={3}
            defaultValue={template?.next_actions_template ?? ""}
            placeholder="Default next actions content."
          />
        </FormSection>

        {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}

        <FormFooter>
          <Button type="submit" disabled={isPending} loading={isPending} loadingText={pendingLabel}>
            {submitLabel}
          </Button>
        </FormFooter>
      </FormRoot>
    </form>
  );
}
