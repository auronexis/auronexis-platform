import type { CustomerSuccessRecord } from "@/types/database";
import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { updateCustomerSuccessForm } from "@/lib/sales/actions";

type CustomerSuccessTableProps = {
  records: CustomerSuccessRecord[];
  canManage: boolean;
};

export function CustomerSuccessTable({ records, canManage }: CustomerSuccessTableProps) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={HeartHandshake}
        title="No customer success records yet"
        description="Enroll founding customers to track onboarding milestones, renewal health, and pilot outcomes."
        action={
          <Link href="/sales/onboarding">
            <Button size="sm">Open onboarding</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <CustomerSuccessRow key={record.id} record={record} canManage={canManage} />
      ))}
    </div>
  );
}

function CustomerSuccessRow({
  record,
  canManage,
}: {
  record: CustomerSuccessRecord;
  canManage: boolean;
}) {
  return (
    <section className="aurora-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">Customer record</h3>
          <p className="text-sm text-muted">
            Milestones {record.milestones_completed}/{record.milestones_total}
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {record.renewal_probability}% renewal
        </span>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-5">
        <Score label="Adoption" value={record.adoption_score} />
        <Score label="Usage" value={record.usage_score} />
        <Score label="Success" value={record.success_score} />
        <Score label="Risk" value={record.risk_score} />
        <Score label="Renewal" value={record.renewal_probability} />
      </dl>

      {canManage ? (
        <form action={updateCustomerSuccessForm} className="mt-4 flex flex-wrap items-end gap-4">
          <input type="hidden" name="recordId" value={record.id} />
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-foreground">Milestones completed</span>
            <input
              name="milestonesCompleted"
              type="number"
              min={0}
              max={record.milestones_total}
              defaultValue={record.milestones_completed}
              className="w-24 rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="onboardingComplete" defaultChecked={record.onboarding_complete} />
            Onboarding complete
          </label>
          <Button type="submit" size="sm">
            Update scores
          </Button>
        </form>
      ) : null}
    </section>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className="text-lg font-semibold text-foreground">{value}</dd>
    </div>
  );
}
