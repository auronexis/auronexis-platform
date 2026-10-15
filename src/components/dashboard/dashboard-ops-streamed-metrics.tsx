import { requireSession } from "@/lib/auth/session";
import { buildOperationalTasks } from "@/lib/ai/operational/tasks";
import { getOperationalIntelligence } from "@/lib/ai/insights/get-intelligence";
import { getDashboardData } from "@/lib/dashboard/queries";
import { getIntegrationRuntimeSummary } from "@/lib/integrations/queries";
import { getComplianceDiagnosticsSnapshot } from "@/lib/compliance/diagnostics";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { cn } from "@/lib/utils/cn";

type StreamAccess = {
  operationalAiAccess: boolean;
  automationAccess: boolean;
  canManageCompliance: boolean;
};

function OpsBadgeChip({
  count,
  urgent = false,
}: {
  count: number;
  urgent?: boolean;
}) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
        urgent ? "bg-danger/15 text-danger" : "bg-muted/20 text-muted",
      )}
    >
      {count}
    </span>
  );
}

/** Suspense-streamed Intelligence tab badge (AI operational task count). */
export async function OpsIntelligenceTabBadge({ access }: { access: StreamAccess }) {
  const session = await requireSession();
  const data = await getDashboardData(session);
  if (!(data.features.risks || data.features.incidents) || !access.operationalAiAccess) {
    return null;
  }
  const operationalTasks = await buildOperationalTasks(session);
  return <OpsBadgeChip count={operationalTasks.tasks.length} />;
}

/** Suspense-streamed Automation tab badge (failed + retrying runtimes). */
export async function OpsAutomationTabBadge({ access }: { access: StreamAccess }) {
  if (!access.automationAccess) return null;
  const session = await requireSession();
  const summary = await getIntegrationRuntimeSummary({
    organizationId: session.organization.id,
  });
  const count = (summary?.failed ?? 0) + (summary?.retrying ?? 0);
  return <OpsBadgeChip count={count} urgent={count > 0} />;
}

/** Suspense-streamed Governance tab badge (open GDPR + security incidents). */
export async function OpsGovernanceTabBadge({ access }: { access: StreamAccess }) {
  if (!access.canManageCompliance) return null;
  const session = await requireSession();
  if (!canManageOrganizationSettings(session)) return null;
  const compliance = await getComplianceDiagnosticsSnapshot(session);
  const count =
    (compliance?.openGdprRequests ?? 0) + (compliance?.openSecurityIncidents ?? 0);
  return <OpsBadgeChip count={count} urgent={count > 0} />;
}

/**
 * Suspense-streamed "AI tasks" summary count.
 * Renders nothing until ready — never a dash or fake zero.
 */
export async function OpsAiTasksSummary({ access }: { access: StreamAccess }) {
  const session = await requireSession();
  const data = await getDashboardData(session);
  if (!(data.features.risks || data.features.incidents) || !access.operationalAiAccess) {
    return null;
  }
  const operationalTasks = await buildOperationalTasks(session);
  const count = operationalTasks.tasks.length;
  return (
    <span>
      <span className="font-semibold text-foreground">{count}</span> AI tasks
    </span>
  );
}

/** Suspense-streamed Workspace Health % from Ops Intelligence (request-cached). */
export async function StreamedWorkspaceHealthPercent({
  aiAccess,
  fallbackPercent,
}: {
  aiAccess: boolean;
  fallbackPercent: number;
}) {
  if (!aiAccess) {
    return <>{fallbackPercent}%</>;
  }
  const session = await requireSession();
  const data = await getDashboardData(session);
  const intelligence = await getOperationalIntelligence(session, data);
  const score = intelligence.workspaceHealth?.score ?? fallbackPercent;
  return <>{score}%</>;
}
