import type { CustomerOnboardingRecord } from "@/types/database";
import {
  CUSTOMER_ONBOARDING_CHECKLIST,
  KICKOFF_WORKFLOW_STEPS,
} from "@/lib/sales/customer-onboarding";
import { updateCustomerOnboardingForm } from "@/lib/sales/actions";
import { Button } from "@/components/ui/button";

type CustomerOnboardingTableProps = {
  records: CustomerOnboardingRecord[];
  canManage: boolean;
};

export function CustomerOnboardingTable({ records, canManage }: CustomerOnboardingTableProps) {
  if (records.length === 0) {
    return (
      <section className="aurora-surface p-6">
        <h2 className="text-base font-semibold text-foreground">Customer onboarding</h2>
        <p className="mt-2 text-sm text-muted">Start onboarding from a won lead to track kickoff and delivery.</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Kickoff workflow</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {KICKOFF_WORKFLOW_STEPS.map((step) => (
                <li key={step}>• {step}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Onboarding checklist</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {CUSTOMER_ONBOARDING_CHECKLIST.map((step) => (
                <li key={step}>• {step}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <section key={record.id} className="aurora-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground">Onboarding record</h3>
              <p className="text-sm text-muted">
                Checklist {record.checklist_completed}/{record.checklist_total} · {record.status}
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Health {record.health_baseline_score}%
            </span>
          </div>
          {canManage ? (
            <form action={updateCustomerOnboardingForm} className="mt-4 flex flex-wrap items-end gap-4">
              <input type="hidden" name="recordId" value={record.id} />
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">Checklist completed</span>
                <input
                  name="checklistCompleted"
                  type="number"
                  min={0}
                  max={record.checklist_total}
                  defaultValue={record.checklist_completed}
                  className="w-24 rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
                />
              </label>
              <Toggle name="workspaceCreated" label="Workspace created" defaultChecked={record.workspace_created} />
              <Toggle name="teamInvited" label="Team invited" defaultChecked={record.team_invited} />
              <Toggle name="integrationsConnected" label="Integrations" defaultChecked={record.integrations_connected} />
              <Toggle name="diagnosticsBaseline" label="Diagnostics baseline" defaultChecked={record.diagnostics_baseline} />
              <Button type="submit" size="sm">
                Update onboarding
              </Button>
            </form>
          ) : null}
        </section>
      ))}
    </div>
  );
}

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}
