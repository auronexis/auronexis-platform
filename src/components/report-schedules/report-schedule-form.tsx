"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter, FormRoot, FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ReportScheduleActionState } from "@/lib/report-schedules/actions";
import {
  SCHEDULE_FREQUENCIES,
  SCHEDULE_FREQUENCY_LABELS,
  type ReportScheduleWithRelations,
} from "@/lib/report-schedules/types";
import { formGrid } from "@/lib/ui/form-tokens";
import { useFormActionFeedback } from "@/lib/ui/use-form-action-feedback";
import type { AppUser, Client, ReportScheduleFrequency, ReportTemplate } from "@/types/database";

type ReportScheduleFormProps = {
  action: (
    prevState: ReportScheduleActionState,
    formData: FormData,
  ) => Promise<ReportScheduleActionState>;
  schedule?: ReportScheduleWithRelations;
  clients: Pick<Client, "id" | "name">[];
  orgUsers: Pick<AppUser, "id" | "full_name">[];
  templates: Pick<ReportTemplate, "id" | "name" | "is_default">[];
  submitLabel: string;
  pendingLabel: string;
};

const initialState: ReportScheduleActionState = {};

export function ReportScheduleForm({
  action,
  schedule,
  clients,
  orgUsers,
  templates,
  submitLabel,
  pendingLabel,
}: ReportScheduleFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const defaultFrequency = schedule?.frequency ?? "monthly";

  useFormActionFeedback(state, isPending);

  return (
    <form action={formAction}>
      <FormRoot>
        <FormSection title="Schedule" description="Define when and for whom reports are generated.">
          <Input
            name="titleTemplate"
            label="Title template"
            required
            defaultValue={schedule?.title_template ?? ""}
            placeholder="Monthly Operations Report"
          />
          <div className={formGrid}>
            <Select
              id="clientId"
              name="clientId"
              label="Client"
              required
              defaultValue={schedule?.client_id ?? ""}
              placeholder="Select a client"
              options={clients.map((client) => ({
                value: client.id,
                label: client.name,
              }))}
            />
            <Select
              id="frequency"
              name="frequency"
              label="Frequency"
              required
              defaultValue={defaultFrequency}
              options={SCHEDULE_FREQUENCIES.map((frequency) => ({
                value: frequency,
                label: SCHEDULE_FREQUENCY_LABELS[frequency as ReportScheduleFrequency],
              }))}
            />
            <Input
              name="dayOfMonth"
              type="number"
              min={1}
              max={28}
              label="Day of month (monthly only)"
              defaultValue={schedule?.day_of_month?.toString() ?? ""}
              placeholder="1–28"
            />
            <Select
              id="templateId"
              name="templateId"
              label="Report template (optional)"
              defaultValue={schedule?.template_id ?? ""}
              description="When generating a draft, template content pre-fills report sections."
              options={[
                { value: "", label: "No template" },
                ...templates.map((template) => ({
                  value: template.id,
                  label: `${template.name}${template.is_default ? " (default)" : ""}`,
                })),
              ]}
            />
            <Select
              id="assignedUserId"
              name="assignedUserId"
              label="Assigned user (optional)"
              defaultValue={schedule?.assigned_user_id ?? ""}
              options={[
                { value: "", label: "Current user on generate" },
                ...orgUsers.map((user) => ({
                  value: user.id,
                  label: user.full_name,
                })),
              ]}
            />
          </div>
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
