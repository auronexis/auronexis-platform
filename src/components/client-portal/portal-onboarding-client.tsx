"use client";

import { useActionState } from "react";
import { CheckCircle2, ClipboardList, ListTodo } from "lucide-react";
import {
  PortalHero,
  PortalKpiCard,
  PortalKpiMetric,
} from "@/components/client-portal/portal-ui";
import { FormAlert } from "@/components/ui/form-alert";
import { Button } from "@/components/ui/button";
import { submitPortalOnboardingFeedback, type PortalFeedbackState } from "@/lib/client-portal/actions";
import { PORTAL_ONBOARDING_MILESTONES } from "@/lib/sales/portal-onboarding";
import type { ResolvedOrganizationBranding } from "@/lib/branding/defaults";

const initialState: PortalFeedbackState = {};

type PortalOnboardingClientProps = {
  clientName: string;
  branding: ResolvedOrganizationBranding;
  onboarding: {
    onboarding_status: string;
    milestones_completed: number;
    milestones_total: number;
    open_tasks: number;
    feedback: string | null;
    satisfaction_score: number | null;
  } | null;
};

export function PortalOnboardingClient({
  clientName,
  branding,
  onboarding,
}: PortalOnboardingClientProps) {
  const [state, action, pending] = useActionState(submitPortalOnboardingFeedback, initialState);
  const milestonesCompleted = onboarding?.milestones_completed ?? 0;
  const milestonesTotal = onboarding?.milestones_total ?? PORTAL_ONBOARDING_MILESTONES.length;

  return (
    <>
      <PortalHero clientName={clientName} branding={branding} />

      <div className="grid gap-5 sm:grid-cols-3">
        <PortalKpiCard label="Onboarding status" icon={CheckCircle2} tone="primary" subtext="Current phase">
          <PortalKpiMetric>{onboarding?.onboarding_status ?? "not_started"}</PortalKpiMetric>
        </PortalKpiCard>
        <PortalKpiCard label="Milestones" icon={ClipboardList} tone="success" subtext="Progress">
          <PortalKpiMetric>
            {milestonesCompleted}/{milestonesTotal}
          </PortalKpiMetric>
        </PortalKpiCard>
        <PortalKpiCard label="Open tasks" icon={ListTodo} tone="warning" subtext="Remaining">
          <PortalKpiMetric>{onboarding?.open_tasks ?? 0}</PortalKpiMetric>
        </PortalKpiCard>
      </div>

      <section className="mt-10 aurora-surface p-6">
        <h2 className="text-base font-semibold text-foreground">Milestones</h2>
        <ul className="mt-4 space-y-2">
          {PORTAL_ONBOARDING_MILESTONES.map((milestone, index) => (
            <li key={milestone} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                  index < milestonesCompleted
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-border-subtle text-muted"
                }`}
              >
                {index + 1}
              </span>
              <span className={index < milestonesCompleted ? "text-foreground" : "text-muted"}>{milestone}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 aurora-surface p-6">
        <h2 className="text-base font-semibold text-foreground">Reports & tasks</h2>
        <p className="mt-2 text-sm text-muted">
          View sent reports under Reports. Open tasks: {onboarding?.open_tasks ?? 0}.
        </p>
      </section>

      <section className="mt-8 aurora-surface p-6">
        <h2 className="text-base font-semibold text-foreground">Feedback</h2>
        {onboarding?.feedback ? (
          <p className="mt-2 text-sm text-muted">{onboarding.feedback}</p>
        ) : (
          <form action={action} className="mt-4 space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-foreground">Your feedback</span>
              <textarea
                name="feedback"
                required
                rows={4}
                className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
                placeholder="How is onboarding going?"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-foreground">Satisfaction (0–100)</span>
              <input
                name="satisfactionScore"
                type="number"
                min={0}
                max={100}
                defaultValue={80}
                className="w-24 rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
              />
            </label>
            {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}
            {state.success ? <FormAlert variant="success">Feedback submitted. Thank you!</FormAlert> : null}
            <Button type="submit" disabled={pending}>
              {pending ? "Submitting…" : "Submit feedback"}
            </Button>
          </form>
        )}
      </section>
    </>
  );
}
