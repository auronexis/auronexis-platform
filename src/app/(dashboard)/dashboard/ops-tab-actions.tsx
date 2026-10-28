"use server";

import type { ReactNode } from "react";
import {
  DashboardOpsAutomationTab,
  DashboardOpsGovernanceTab,
  DashboardOpsIntelligenceTab,
} from "@/components/dashboard/dashboard-ops-tab-panels";
import { requireSession } from "@/lib/auth/session";
import { isLazyOpsTab, resolveOpsTabAccess } from "@/lib/dashboard/ops-tab-access";

/**
 * Renders one dashboard Ops tab on demand.
 *
 * The Intelligence, Automation and Governance tabs used to be rendered on every dashboard
 * visit even though only the Overview tab is visible at first. They now load when opened.
 * The tab name is checked against an allowlist and access is derived from the session.
 */
export async function loadDashboardOpsTab(tab: unknown): Promise<ReactNode> {
  if (!isLazyOpsTab(tab)) {
    throw new Error("Unknown dashboard tab.");
  }

  const session = await requireSession();
  const access = await resolveOpsTabAccess(session);

  switch (tab) {
    case "intelligence":
      return <DashboardOpsIntelligenceTab access={access} />;
    case "automation":
      return <DashboardOpsAutomationTab access={access} />;
    case "governance":
      return <DashboardOpsGovernanceTab access={access} />;
  }
}
