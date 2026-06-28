"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter, FormRoot, FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { EscalationRuleActionState } from "@/lib/escalation/actions";
import {
  ESCALATION_TRIGGER_LABELS,
  ESCALATION_TRIGGER_TYPES,
} from "@/lib/escalation/types";
import { formGrid } from "@/lib/ui/form-tokens";
import { useFormActionFeedback } from "@/lib/ui/use-form-action-feedback";
import type { EscalationRule } from "@/types/database";

type EscalationRuleFormProps = {
  action: (
    prevState: EscalationRuleActionState,
    formData: FormData,
  ) => Promise<EscalationRuleActionState>;
  rule?: EscalationRule;
  submitLabel: string;
  pendingLabel: string;
  readOnly?: boolean;
};

const initialState: EscalationRuleActionState = {};

function CheckboxField({
  name,
  label,
  description,
  defaultChecked,
  readOnly,
}: {
  name: string;
  label: string;
  description?: string;
  defaultChecked: boolean;
  readOnly?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-border p-4">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        disabled={readOnly}
        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
      />
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {description ? <span className="mt-1 block text-sm text-muted">{description}</span> : null}
      </span>
    </label>
  );
}

export function EscalationRuleForm({
  action,
  rule,
  submitLabel,
  pendingLabel,
  readOnly = false,
}: EscalationRuleFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  useFormActionFeedback(state, isPending);

  return (
    <form action={formAction}>
      <FormRoot>
        <FormSection title="Rule" description="Define when and how this escalation fires.">
          <Input
            name="name"
            label="Rule name"
            required
            defaultValue={rule?.name ?? ""}
            placeholder="Critical Incident"
            disabled={readOnly}
          />
          <Select
            id="triggerType"
            name="triggerType"
            label="Trigger"
            required
            defaultValue={rule?.trigger_type ?? "critical_incident"}
            disabled={readOnly}
            options={ESCALATION_TRIGGER_TYPES.map((triggerType) => ({
              value: triggerType,
              label: ESCALATION_TRIGGER_LABELS[triggerType],
            }))}
          />
          <Input
            name="severity"
            label="Severity filter (optional)"
            defaultValue={rule?.severity ?? ""}
            placeholder="Reserved for future use"
            disabled={readOnly}
          />
          <Input
            name="delayMinutes"
            label="Delay (minutes)"
            type="number"
            min={0}
            step={1}
            defaultValue={rule?.delay_minutes?.toString() ?? "0"}
            disabled={readOnly}
          />
        </FormSection>

        <FormSection title="Actions" description="Choose what happens when this rule triggers.">
          <div className={formGrid}>
            <CheckboxField
              name="notifyOwner"
              label="Notify Owner/Admin"
              description="Send notifications to organization owners and admins."
              defaultChecked={rule?.notify_owner ?? true}
              readOnly={readOnly}
            />
            <CheckboxField
              name="notifyAssignedUser"
              label="Notify assigned user"
              description="Send notifications to the assigned team member when available."
              defaultChecked={rule?.notify_assigned_user ?? true}
              readOnly={readOnly}
            />
            <CheckboxField
              name="createActivity"
              label="Create activity"
              description="Record an escalation event in the activity feed."
              defaultChecked={rule?.create_activity ?? true}
              readOnly={readOnly}
            />
            <CheckboxField
              name="createNotification"
              label="Create notification"
              description="Create in-app notifications based on recipient settings."
              defaultChecked={rule?.create_notification ?? true}
              readOnly={readOnly}
            />
            <CheckboxField
              name="enabled"
              label="Enabled"
              description="Only enabled rules are evaluated when triggers fire."
              defaultChecked={rule?.enabled ?? true}
              readOnly={readOnly}
            />
          </div>
        </FormSection>

        {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}

        {!readOnly ? (
          <FormFooter>
            <Button
              type="submit"
              disabled={isPending}
              loading={isPending}
              loadingText={pendingLabel}
            >
              {submitLabel}
            </Button>
          </FormFooter>
        ) : null}
      </FormRoot>
    </form>
  );
}
