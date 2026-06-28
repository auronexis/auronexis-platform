"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Select } from "@/components/ui/select";
import { refreshClientPortfolioServerAction } from "@/lib/ai/client-success/action";
import type { ClientSuccessPortfolioResult } from "@/lib/ai/client-success/types";
import { CLIENT_HEALTH_LABELS } from "@/lib/ai/client-success/types";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type ClientsSuccessWorkspaceProps = {
  initialData: ClientSuccessPortfolioResult;
};

type RankingTab = "highestRisk" | "highestValue" | "mostImproved" | "needsAttention" | "bestPerforming";

const TAB_LABELS: Record<RankingTab, string> = {
  highestRisk: "Highest risk",
  highestValue: "Highest value",
  mostImproved: "Most improved",
  needsAttention: "Needs attention",
  bestPerforming: "Best performing",
};

export function ClientsSuccessWorkspace({ initialData }: ClientsSuccessWorkspaceProps) {
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<RankingTab>("needsAttention");
  const [healthFilter, setHealthFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result = await refreshClientPortfolioServerAction();
      if (!result.ok) {
        setError(result.error);
        setRetryable(result.retryable ?? false);
        return;
      }
      setData(result.data);
    });
  }, []);

  const filteredClients = useMemo(() => {
    return data.clients.filter((client) => {
      if (healthFilter !== "all" && client.healthLabel !== healthFilter) return false;
      if (priorityFilter !== "all" && client.priority !== priorityFilter) return false;
      if (statusFilter !== "all" && client.status !== statusFilter) return false;
      return true;
    });
  }, [data.clients, healthFilter, priorityFilter, statusFilter]);

  const activeRanking = data[tab];

  return (
    <div className="space-y-8">
      {error ? (
        <div className="space-y-2">
          <FormAlert variant="error">{error}</FormAlert>
          {retryable ? (
            <Button type="button" variant="outline" size="sm" onClick={refresh}>
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(Object.keys(TAB_LABELS) as RankingTab[]).map((key) => (
          <Button
            key={key}
            type="button"
            variant={tab === key ? "primary" : "outline"}
            size="sm"
            onClick={() => setTab(key)}
          >
            {TAB_LABELS[key]}
          </Button>
        ))}
        <Button type="button" variant="outline" size="sm" loading={isPending} onClick={refresh} className="ml-auto">
          Refresh
        </Button>
      </div>

      <section aria-label="Filters" className="grid gap-4 sm:grid-cols-3">
        <Select
          id="success-filter-health"
          label="Health"
          value={healthFilter}
          onChange={(event) => setHealthFilter(event.target.value)}
          options={[
            { value: "all", label: "All health" },
            ...Object.entries(CLIENT_HEALTH_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        />
        <Select
          id="success-filter-priority"
          label="Priority"
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
          options={[
            { value: "all", label: "All priorities" },
            { value: "critical", label: "Critical" },
            { value: "attention", label: "Attention" },
            { value: "good", label: "Good" },
            { value: "excellent", label: "Excellent" },
          ]}
        />
        <Select
          id="success-filter-status"
          label="Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "archived", label: "Archived" },
          ]}
        />
      </section>

      <section aria-label="Client ranking">
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/10 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Health</th>
                <th className="px-4 py-3">Churn</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Margin</th>
                <th className="px-4 py-3">Open items</th>
              </tr>
            </thead>
            <tbody>
              {(tab === "needsAttention" ? filteredClients : activeRanking).slice(0, 15).map((client) => (
                <tr key={client.clientId} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link href={`/clients/${client.clientId}`} className={linkText}>
                      {client.clientName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {client.healthScore}% · {CLIENT_HEALTH_LABELS[client.healthLabel]}
                  </td>
                  <td className="px-4 py-3 capitalize">{client.churnRisk.replace("_", " ")}</td>
                  <td className="px-4 py-3 capitalize">{client.priority}</td>
                  <td className="px-4 py-3">{client.margin != null ? `${client.margin}%` : "—"}</td>
                  <td className="px-4 py-3 text-muted">
                    {client.openRisks} risks · {client.openIncidents} incidents
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function CustomerSuccessDashboardCard({
  highlights,
  aiEnabled,
  upgradeMessage,
  requiredPlanLabel,
}: {
  highlights: ClientSuccessPortfolioResult["highlights"];
  aiEnabled: boolean;
  upgradeMessage: string;
  requiredPlanLabel?: string;
}) {
  if (!aiEnabled) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/[0.04] p-5">
        <p className="text-sm font-semibold text-foreground">Customer Success</p>
        <p className="mt-2 text-sm text-muted">{upgradeMessage}</p>
        {requiredPlanLabel ? (
          <p className="mt-1 text-xs font-medium text-foreground">{requiredPlanLabel} plan required</p>
        ) : null}
        <Link href="/settings/plans">
          <Button type="button" variant="primary" size="sm" className="mt-4">
            View plans
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {highlights.length === 0 ? (
        <p className="rounded-xl border border-border bg-muted/5 px-4 py-6 text-sm text-muted">
          Your customer portfolio looks healthy.
        </p>
      ) : (
        <ul className="space-y-3">
          {highlights.slice(0, 3).map((item) => (
            <li key={item.id} className="rounded-xl border border-border bg-surface/80 px-4 py-3 text-sm text-foreground">
              {item.message}
            </li>
          ))}
        </ul>
      )}
      <Link href="/clients/success" className={cn(linkText, "inline-flex items-center gap-1 text-sm")}>
        View all
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
