"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ACTIVITY_FILTER_LABELS, type ActivityFilter } from "@/lib/activity/types";
import { cn } from "@/lib/utils/cn";
import { filterTabActive, filterTabInactive } from "@/lib/ui/tokens";

const FILTERS: ActivityFilter[] = [
  "all",
  "clients",
  "risks",
  "incidents",
  "reports",
  "team",
  "financial",
];

export function ActivityFilterTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("filter") as ActivityFilter | null) ?? "all";

  return (
    <nav aria-label="Filter activity" className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => {
        const params = new URLSearchParams(searchParams.toString());

        if (filter === "all") {
          params.delete("filter");
        } else {
          params.set("filter", filter);
        }

        const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        const isActive = current === filter;

        return (
          <Link
            key={filter}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1.5",
              isActive ? filterTabActive : filterTabInactive,
              isActive && "bg-secondary text-primary-foreground no-underline",
            )}
          >
            {ACTIVITY_FILTER_LABELS[filter]}
          </Link>
        );
      })}
    </nav>
  );
}
