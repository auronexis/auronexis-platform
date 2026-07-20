"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import { useWorkspaceMoney } from "@/components/workspace/workspace-money-provider";
import { exportAuditAction } from "@/lib/compliance/actions";
import type { AuditEventView, AuditSearchResult } from "@/lib/compliance/types";
import { groupAuditTimelineByDay, formatTimelineLabel } from "@/lib/audit/timeline";
import { cn } from "@/lib/utils/cn";

type AuditExplorerProps = {
  initialResult: AuditSearchResult;
};

function SeverityBadge({ severity }: { severity: AuditEventView["severity"] }) {
  const styles = {
    info: "bg-muted/10 text-muted",
    low: "bg-success/10 text-success",
    medium: "bg-warning/10 text-warning",
    high: "bg-danger/10 text-danger",
    critical: "bg-danger/20 text-danger",
  } as const;

  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold capitalize", styles[severity])}>{severity}</span>;
}

export function AuditExplorer({ initialResult }: AuditExplorerProps) {
  const result = initialResult;
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { formatDateTime, locale } = useWorkspaceMoney();
  const timeline = useMemo(() => groupAuditTimelineByDay(result.items), [result.items]);

  const [query, setQuery] = useState("");
  const [entityType, setEntityType] = useState("");
  const [severity, setSeverity] = useState("");

  const downloadExport = (format: "csv" | "json") => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const response = await exportAuditAction({
        format,
        query: query || undefined,
        entityType: entityType || undefined,
        severity: severity || undefined,
      });

      if (response.error) {
        setError(response.error);
        return;
      }

      setSuccess(response.success ?? "Export completed.");
      if (response.downloadContent && response.downloadFilename) {
        const blob = new Blob([response.downloadContent], {
          type: format === "csv" ? "text/csv" : "application/json",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = response.downloadFilename;
        anchor.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  return (
    <div className="space-y-8">
      <PageSurface>
        <PageSurfaceHeading title="Audit search" description="Timeline across immutable audit events and mapped activity history." />
        <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={(event) => event.preventDefault()}>
          <Input name="query" label="Search" placeholder="event or entity" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Input name="entityType" label="Entity type" placeholder="client, report..." value={entityType} onChange={(event) => setEntityType(event.target.value)} />
          <Input name="severity" label="Severity" placeholder="info, high..." value={severity} onChange={(event) => setSeverity(event.target.value)} />
          <div className="flex items-end gap-2">
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => downloadExport("csv")}>
              CSV export
            </Button>
            <Button type="button" disabled={isPending} onClick={() => downloadExport("json")}>
              JSON export
            </Button>
          </div>
        </form>
        {error ? <FormAlert variant="error">{error}</FormAlert> : null}
        {success ? <FormAlert variant="success">{success}</FormAlert> : null}
      </PageSurface>

      <PageSurface>
        <PageSurfaceHeading title="Timeline" description={`${result.total} events · page ${result.page}`} />
        <div className="mt-4 space-y-6">
          {timeline.map((group) => (
            <div key={group.date}>
              <p className="text-sm font-semibold text-foreground">{formatTimelineLabel(group.date, locale)}</p>
              <div className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border/70 px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-foreground">{item.eventType}</p>
                      <SeverityBadge severity={item.severity} />
                    </div>
                    <p className="text-muted">
                      {item.entityType}
                      {item.entityId ? ` · ${item.entityId}` : ""} · {item.source}
                    </p>
                    <p className="text-xs text-muted">{formatDateTime(item.createdAt)}</p>
                    {item.deepLink ? (
                      <Link href={item.deepLink} className="text-xs font-medium text-primary hover:underline">
                        Open entity
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PageSurface>
    </div>
  );
}
