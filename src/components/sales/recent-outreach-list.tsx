import Link from "next/link";
import { Mail } from "lucide-react";
import type { SalesLeadActivity } from "@/types/database";
import { formatDistanceToNow } from "@/lib/utils/date";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

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
        <div className="mt-4">
          <EmptyState
            icon={Mail}
            title="No outreach logged yet"
            description="Log calls, emails, and meetings on lead records to track follow-ups and pipeline momentum."
            action={
              <Link href="/sales/leads">
                <Button size="sm" variant="secondary">
                  Open leads
                </Button>
              </Link>
            }
            className="min-h-[10rem] py-8"
          />
        </div>
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
