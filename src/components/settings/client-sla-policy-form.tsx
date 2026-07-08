"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter, FormRoot, FormSection } from "@/components/ui/form-section";
import { Select } from "@/components/ui/select";
import { assignClientSlaPolicyAction, type SlaPolicyActionState } from "@/lib/sla/actions";
import { useFormActionFeedback } from "@/lib/ui/use-form-action-feedback";
import { cn } from "@/lib/utils/cn";
import { focusRing, linkText, transitionInteractive } from "@/lib/ui/tokens";
import type { SlaPolicy } from "@/types/database";

type ClientSlaPolicyFormProps = {
  clientId: string;
  policies: SlaPolicy[];
  currentPolicyId: string | null;
  defaultPolicy?: SlaPolicy | null;
  readOnly?: boolean;
  planRestricted?: boolean;
  planUpgradeMessage?: string;
};

const initialState: SlaPolicyActionState = {};
const PLAN_UPGRADE_MESSAGE = "SLA assignment is available on the Business plan.";

export function ClientSlaPolicyForm({
  clientId,
  policies,
  currentPolicyId,
  defaultPolicy,
  readOnly = false,
  planRestricted = false,
  planUpgradeMessage = PLAN_UPGRADE_MESSAGE,
}: ClientSlaPolicyFormProps) {
  const boundAction = assignClientSlaPolicyAction.bind(null, clientId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  const inheritedDefault = defaultPolicy ?? policies.find((policy) => policy.is_default) ?? null;
  const formDisabled = readOnly || planRestricted;

  useFormActionFeedback(state, isPending, { successMessage: "SLA assignment saved" });

  const policyOptions = [
    {
      value: "",
      label: inheritedDefault
        ? `Use organization default (${inheritedDefault.name})`
        : "No SLA policy",
    },
    ...policies.map((policy) => ({
      value: policy.id,
      label: `${policy.name}${policy.is_default ? " (organization default)" : ""}`,
    })),
  ];

  return (
    <form action={formAction}>
      <FormRoot>
        {planRestricted ? (
          <div className="rounded-lg border border-warning/20 bg-warning/5 px-4 py-3">
            <p className="text-sm text-foreground">{planUpgradeMessage}</p>
            <Link
              href="/settings/plans"
              className={cn(
                linkText,
                "mt-3 inline-flex text-sm font-medium",
                transitionInteractive,
                focusRing,
              )}
            >
              View plans
            </Link>
          </div>
        ) : null}

        <FormSection
          title="SLA override"
          description="Leave unset to inherit the organization default automatically."
        >
          <Select
            id="slaPolicyId"
            name="slaPolicyId"
            label="Override SLA policy"
            defaultValue={currentPolicyId ?? ""}
            disabled={formDisabled}
            options={policyOptions}
          />
        </FormSection>

        {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}

        {!formDisabled ? (
          <FormFooter>
            <Button type="submit" disabled={isPending} loading={isPending} loadingText="Saving…">
              Save SLA assignment
            </Button>
          </FormFooter>
        ) : null}
      </FormRoot>
    </form>
  );
}
