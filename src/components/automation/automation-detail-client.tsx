"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AutomationDetailWorkspace } from "@/components/automation/automation-detail-workspace";
import { useAutomationStore } from "@/components/automation/automation-store-provider";

type AutomationDetailClientProps = {
  workflowId: string;
  canManage: boolean;
  canRunManual: boolean;
};

export function AutomationDetailClient({
  workflowId,
  canManage,
  canRunManual,
}: AutomationDetailClientProps) {
  const { store } = useAutomationStore();
  const workflow = useMemo(
    () => store.automations.find((item) => item.id === workflowId),
    [store.automations, workflowId],
  );

  if (!workflow) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/5 p-8 text-center">
        <p className="text-sm font-medium text-foreground">Automation not found</p>
        <p className="mt-2 text-sm text-muted">
          This workflow may have been deleted or is not available in your workspace.
        </p>
        <Link href="/automation/new" className="mt-4 inline-block text-sm font-medium text-accent-blue hover:underline">
          Create automation
        </Link>
      </div>
    );
  }

  return (
    <AutomationDetailWorkspace
      workflow={workflow}
      canManage={canManage}
      canRunManual={canRunManual}
    />
  );
}
