"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import {
  createGdprRequestAction,
  createSecurityIncidentAction,
  exportEvidenceAction,
  type ComplianceActionState,
} from "@/lib/compliance/actions";
import type { ComplianceDashboardData } from "@/lib/compliance/types";
import { FRAMEWORK_LABELS, GDPR_REQUEST_LABELS } from "@/lib/compliance/types";
import { cn } from "@/lib/utils/cn";

type ComplianceWorkspaceProps = {
  dashboard: ComplianceDashboardData;
  gdprRequests: Awaited<ReturnType<typeof import("@/lib/compliance/gdpr").listGdprRequests>>;
  securityIncidents: Awaited<ReturnType<typeof import("@/lib/compliance/incidents").listSecurityIncidents>>;
  retentionRules: Awaited<ReturnType<typeof import("@/lib/compliance/retention").listRetentionRules>>;
};

function ScoreCard({
  title,
  value,
  subtitle,
  tone = "default",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  tone?: "default" | "warning" | "success";
}) {
  const styles = {
    default: "border-border/70",
    warning: "border-warning/40 bg-warning/5",
    success: "border-success/40 bg-success/5",
  } as const;

  return (
    <div className={cn("rounded-xl border p-4", styles[tone])}>
      <p className="text-xs uppercase tracking-wide text-muted">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
      {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
    </div>
  );
}

export function ComplianceWorkspace({
  dashboard,
  gdprRequests,
  securityIncidents,
  retentionRules,
}: ComplianceWorkspaceProps) {
  const [message, setMessage] = useState<ComplianceActionState | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<ComplianceActionState>) => {
    startTransition(async () => {
      const result = await action();
      setMessage(result);
      if (result.downloadContent && result.downloadFilename) {
        const blob = new Blob([result.downloadContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = result.downloadFilename;
        anchor.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ScoreCard title="Compliance score" value={dashboard.complianceScore} subtitle={`${dashboard.readinessLevel} maturity`} tone="success" />
        <ScoreCard title="Readiness" value={`${dashboard.readinessPercent}%`} subtitle="Framework readiness (not certification)" />
        <ScoreCard title="Open findings" value={dashboard.openFindings} tone={dashboard.openFindings > 0 ? "warning" : "default"} />
        <ScoreCard title="Security events" value={dashboard.openSecurityIncidents} tone={dashboard.openSecurityIncidents > 0 ? "warning" : "default"} />
      </div>

      {message?.error ? <FormAlert variant="error">{message.error}</FormAlert> : null}
      {message?.success ? <FormAlert variant="success">{message.success}</FormAlert> : null}

      <PageSurface>
        <PageSurfaceHeading title="Framework readiness" description="Readiness scoring only — no certification claims." />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {dashboard.frameworkScores.map((framework) => (
            <div key={framework.framework} className="rounded-lg border border-border/70 p-4">
              <p className="font-medium text-foreground">{FRAMEWORK_LABELS[framework.framework]}</p>
              <p className="mt-1 text-2xl font-semibold">{framework.readinessPercent}%</p>
              <p className="text-sm text-muted">
                {framework.implementedControls}/{framework.totalControls} controls with evidence
              </p>
            </div>
          ))}
        </div>
      </PageSurface>

      <div className="grid gap-8 xl:grid-cols-2">
        <PageSurface>
          <PageSurfaceHeading title="GDPR center" description="Data subject requests with lifecycle tracking." />
          <form
            action={(formData) => run(() => createGdprRequestAction({}, formData))}
            className="mt-4 space-y-3"
          >
            <select name="requestType" className="w-full rounded-lg border border-border px-3 py-2 text-sm">
              {Object.entries(GDPR_REQUEST_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <Input
              name="subjectEmail"
              label="Subject email"
              type="email"
              autoComplete="email"
              required
            />
            <Input name="notes" label="Notes" />
            <Button type="submit" loading={isPending}>Create request</Button>
          </form>
          <div className="mt-4 space-y-2">
            {gdprRequests.slice(0, 5).map((request) => (
              <div key={request.id} className="rounded-lg border border-border/60 px-3 py-2 text-sm">
                <p className="font-medium">{request.requestLabel}</p>
                <p className="text-muted">{request.subjectEmail} · {request.status}</p>
              </div>
            ))}
          </div>
        </PageSurface>

        <PageSurface>
          <PageSurfaceHeading title="Security incidents" description="Internal security incident registry." />
          <form
            action={(formData) => run(() => createSecurityIncidentAction({}, formData))}
            className="mt-4 space-y-3"
          >
            <Input name="title" label="Title" required />
            <Input name="description" label="Description" />
            <select name="severity" className="w-full rounded-lg border border-border px-3 py-2 text-sm">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <Button type="submit" loading={isPending}>Record incident</Button>
          </form>
          <div className="mt-4 space-y-2">
            {securityIncidents.slice(0, 5).map((incident) => (
              <div key={incident.id} className="rounded-lg border border-border/60 px-3 py-2 text-sm">
                <p className="font-medium">{incident.title}</p>
                <p className="text-muted capitalize">{incident.severity} · {incident.status}</p>
              </div>
            ))}
          </div>
        </PageSurface>
      </div>

      <PageSurface>
        <PageSurfaceHeading title="Retention overview" description="Simulation-only retention policies — no automatic deletion in v1." />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {retentionRules.map((rule) => (
            <div key={rule.data_category} className="rounded-lg border border-border/70 px-3 py-2 text-sm">
              <p className="font-medium">{rule.label}</p>
              <p className="text-muted">{rule.retention_period} · {rule.simulation_only ? "Simulation" : "Active"}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">Coverage: {dashboard.retentionCoveragePercent}%</p>
      </PageSurface>

      <PageSurface>
        <PageSurfaceHeading title="Evidence & audit exports" description="Generate read-only evidence bundles and open the audit explorer." />
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/dashboard/compliance/audit">
            <Button type="button" variant="secondary">Open audit explorer</Button>
          </Link>
          <Button type="button" loading={isPending} onClick={() => run(exportEvidenceAction)}>
            Download evidence bundle
          </Button>
        </div>
        {dashboard.recommendations.length > 0 ? (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
            {dashboard.recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </PageSurface>
    </div>
  );
}
