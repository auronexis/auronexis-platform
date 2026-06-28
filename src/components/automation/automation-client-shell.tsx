"use client";

import dynamic from "next/dynamic";
import { AutomationStoreProvider } from "@/components/automation/automation-store-provider";
import type { PlanKey } from "@/lib/billing/plans";
import type { ReactNode } from "react";

const AutomationBuilderWorkspace = dynamic(
  () =>
    import("@/components/automation/automation-builder-workspace").then(
      (mod) => mod.AutomationBuilderWorkspace,
    ),
  {
    loading: () => (
      <div className="rounded-2xl border border-border bg-muted/5 p-8 text-sm text-muted">
        Loading automation builder…
      </div>
    ),
  },
);

type AutomationClientShellProps = {
  children: ReactNode;
  organizationId: string;
  planKey: PlanKey;
};

export function AutomationClientShell({
  children,
  organizationId,
  planKey,
}: AutomationClientShellProps) {
  return (
    <AutomationStoreProvider organizationId={organizationId} planKey={planKey}>
      {children}
    </AutomationStoreProvider>
  );
}

export { AutomationBuilderWorkspace };
