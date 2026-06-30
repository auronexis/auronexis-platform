import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/authorization/access-denied";
import { sessionHasPermission } from "@/lib/authorization/guards";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { ActivityFilterTabs } from "@/components/activity/activity-filter-tabs";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingCard } from "@/components/ui/loading-card";
import { PageSurface } from "@/components/ui/page-surface";
import { listActivityEvents } from "@/lib/activity/queries";
import type { ActivityFilter } from "@/lib/activity/types";
import { requireSession } from "@/lib/auth/session";
import { linkText } from "@/lib/ui/tokens";

export const metadata: Metadata = {
  title: "Activity",
};

const VALID_FILTERS: ActivityFilter[] = [
  "all",
  "clients",
  "risks",
  "incidents",
  "reports",
  "team",
  "financial",
];

type ActivityPageProps = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function ActivityPage({ searchParams }: ActivityPageProps) {
  const session = await requireSession();

  if (!sessionHasPermission(session, "activity.read")) {
    return (
      <>
        <PageHeader module="activity" title="Activity" description="Recent workspace events." />
        <AccessDenied />
      </>
    );
  }

  const params = await searchParams;
  const filterParam = params.filter;
  const filter: ActivityFilter = VALID_FILTERS.includes(filterParam as ActivityFilter)
    ? (filterParam as ActivityFilter)
    : "all";

  const events = await listActivityEvents(session, { filter, limit: 50 });

  return (
    <>
      <PageHeader
        module="activity"
        title="Activity"
        description="Organization-wide audit trail of operational changes across your workspace."
      />
      <Suspense fallback={<LoadingCard lines={1} showHeader={false} className="max-w-md" />}>
        <ActivityFilterTabs />
      </Suspense>
      <PageSurface className="mt-6">
        <ActivityFeed
          events={events}
          emptyMessage="No activity matches this filter"
          emptyDescription="Try a broader filter, or check back after your team makes operational changes."
        />
      </PageSurface>
      <p className="mt-4 text-sm text-muted">
        <Link href="/dashboard" className={linkText}>
          Back to dashboard
        </Link>
      </p>
    </>
  );
}
