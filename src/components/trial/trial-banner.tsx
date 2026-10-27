import Link from "next/link";
import type { WorkspaceTrialState } from "@/lib/plans/types";
import { focusRing } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";

type TrialBannerProps = {
  trial: WorkspaceTrialState | null | undefined;
  hasPaidSubscription: boolean;
};

const PLANS_HREF = "/settings/plans";

/** Workspace-wide notice for the self-serve free trial (running or ended). */
export function TrialBanner({ trial, hasPaidSubscription }: TrialBannerProps) {
  if (!trial || hasPaidSubscription) {
    return null;
  }

  if (trial.active) {
    const days = trial.daysRemaining;
    return (
      <div
        role="status"
        className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <p>
          <span className="font-semibold">Free trial · {days === 1 ? "1 day" : `${days} days`} left.</span>{" "}
          You are testing the Business plan with up to 10 clients. No payment details are stored and the
          trial ends automatically.
        </p>
        <Link
          href={PLANS_HREF}
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground hover:opacity-90",
            focusRing,
          )}
        >
          Choose a plan
        </Link>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p>
        <span className="font-semibold">Your free trial has ended.</span> Your workspace and data are kept.
        Choose a plan to keep adding clients, reports and SLA records.
      </p>
      <Link
        href={PLANS_HREF}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground hover:opacity-90",
          focusRing,
        )}
      >
        Choose a plan
      </Link>
    </div>
  );
}
