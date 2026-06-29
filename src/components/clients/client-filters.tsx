"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import {
  CLIENT_LIST_STATUSES,
  CLIENT_STATUS_LABELS,
  CLIENT_STATUSES,
} from "@/lib/clients/types";
import { filterTabActive, filterTabInactive } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";
import type { ClientStatus } from "@/types/database";

function buildClientsHref(params: { status?: ClientStatus; q?: string }) {
  const search = new URLSearchParams();

  if (params.status) {
    search.set("status", params.status);
  }

  if (params.q) {
    search.set("q", params.q);
  }

  const query = search.toString();
  return query ? `/clients?${query}` : "/clients";
}

export function ClientFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const currentStatus = searchParams.get("status");
  const currentQuery = searchParams.get("q") ?? "";
  const [searchValue, setSearchValue] = useState(currentQuery);

  useEffect(() => {
    setSearchValue(currentQuery);
  }, [currentQuery]);

  const activeStatus = CLIENT_STATUSES.includes(currentStatus as ClientStatus)
    ? (currentStatus as ClientStatus)
    : undefined;

  function navigate(next: { status?: ClientStatus; q?: string }) {
    startTransition(() => {
      router.push(buildClientsHref(next));
    });
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({
      status: activeStatus,
      q: searchValue.trim() || undefined,
    });
  }

  return (
    <div className="mb-6 space-y-4">
      <form onSubmit={handleSearchSubmit} className="flex max-w-md gap-2">
        <Input
          name="q"
          label="Search clients"
          placeholder="Search by name…"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          disabled={isPending}
        />
        <button
          type="submit"
          className={cn(
            "mt-auto h-10 shrink-0 rounded-md border border-border-subtle bg-surface px-4 text-sm font-medium text-foreground hover:bg-muted/10",
            isPending && "opacity-60",
          )}
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={!activeStatus ? filterTabActive : filterTabInactive}
          onClick={() => navigate({ q: currentQuery || undefined })}
        >
          All active
        </button>
        {CLIENT_LIST_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            className={activeStatus === status ? filterTabActive : filterTabInactive}
            onClick={() =>
              navigate({
                status,
                q: currentQuery || undefined,
              })
            }
          >
            {CLIENT_STATUS_LABELS[status]}
          </button>
        ))}
        <button
          type="button"
          className={activeStatus === "archived" ? filterTabActive : filterTabInactive}
          onClick={() =>
            navigate({
              status: "archived",
              q: currentQuery || undefined,
            })
          }
        >
          {CLIENT_STATUS_LABELS.archived}
        </button>
      </div>
    </div>
  );
}
