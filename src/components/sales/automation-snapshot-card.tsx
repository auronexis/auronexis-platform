import type { AutomationSnapshot } from "@/lib/sales/automation";

type AutomationSnapshotCardProps = {
  snapshot: AutomationSnapshot;
};

export function AutomationSnapshotCard({ snapshot }: AutomationSnapshotCardProps) {
  const items = [
    { label: "Pending reminders", value: snapshot.pendingReminders },
    { label: "Overdue reminders", value: snapshot.overdueReminders },
    { label: "No-response leads", value: snapshot.noResponseLeads },
    { label: "Escalated leads", value: snapshot.escalatedLeads },
    { label: "Aging leads", value: snapshot.agingLeads },
  ];

  return (
    <section className="aurora-surface p-5">
      <h2 className="text-base font-semibold text-foreground">Sales automation</h2>
      <p className="mt-1 text-sm text-muted">
        Cadence: {snapshot.cadenceSteps.join(", ")} days · Reminders: {snapshot.reminderTypes.join(", ")}
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs uppercase tracking-wider text-muted">{item.label}</dt>
            <dd className="text-lg font-semibold text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
