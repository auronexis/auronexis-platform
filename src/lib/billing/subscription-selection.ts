import { isSubscriptionUsable } from "@/lib/billing/status";
import type { OrganizationSubscription } from "@/types/database";

/** Pick the best subscription row when history exists — prefer active/trialing over stale rows. */
export function selectPreferredSubscriptionRow(
  rows: OrganizationSubscription[],
): OrganizationSubscription | null {
  if (rows.length === 0) {
    return null;
  }

  const usable = rows.find((row) => isSubscriptionUsable(row.status));
  if (usable) {
    return usable;
  }

  return rows[0] ?? null;
}

export function selectPreferredSubscriptionSummaryRow<
  T extends { status: string | null },
>(rows: T[]): T | null {
  if (rows.length === 0) {
    return null;
  }

  const usable = rows.find((row) => isSubscriptionUsable(row.status));
  if (usable) {
    return usable;
  }

  return rows[0] ?? null;
}
