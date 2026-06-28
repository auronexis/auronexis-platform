import Link from "next/link";
import type { SalesLeadActivity } from "@/types/database";
import { formatDistanceToNow } from "@/lib/utils/date";

export function RecentOutreachList({
  activities,
}: {
  activities: SalesLeadActivity[];
}) {
  return (
    <section className="aurora-surface p-5">
      <h2 className="text-base font-semibold text-foreground">Recent outreach</h2>
      <p className="mt-1 text-sm text-muted">Latest email, call, and meeting activity.</p>
      {activities.length === 0 ? (
        <p className="mt-5 text-sm text-muted">No outreach logged yet.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {activities.map((activity) => (
            <li key={activity.id} className="rounded-xl border border-border-subtle bg-surface-2/40 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{activity.subject ?? activity.activity_type}</p>
                  {activity.body ? <p className="mt-1 line-clamp-2 text-sm text-muted">{activity.body}</p> : null}
                </div>
                <time className="shrink-0 text-xs text-muted">
                  {formatDistanceToNow(new Date(activity.created_at))}
                </time>
              </div>
              <Link href={`/sales/leads/${activity.lead_id}`} className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
                View lead
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
