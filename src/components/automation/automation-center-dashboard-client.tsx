"use client";



import { useEffect, useState } from "react";

import { AutomationCenterCard } from "@/components/automation/automation-center-card";

import { computeDashboardStats, createEmptyStore } from "@/lib/automation/builder";

import { loadAutomationStoreAction } from "@/lib/automation/storage/actions";



type AutomationCenterDashboardClientProps = {

  organizationId: string;

  aiEnabled: boolean;

  upgradeMessage: string;

  requiredPlanLabel?: string;

};



export function AutomationCenterDashboardClient({

  organizationId,

  aiEnabled,

  upgradeMessage,

  requiredPlanLabel,

}: AutomationCenterDashboardClientProps) {

  const [stats, setStats] = useState(() => computeDashboardStats(createEmptyStore()));



  useEffect(() => {

    if (!aiEnabled) return;

    void loadAutomationStoreAction().then((result) => {

      if (result.ok) {

        setStats(computeDashboardStats(result.data));

      }

    });

  }, [aiEnabled, organizationId]);



  return (

    <AutomationCenterCard

      activeCount={stats.activeCount}

      errorCount={stats.failedExecutions}

      pendingCount={stats.draftCount}

      recentCount={stats.todayExecutions}

      aiEnabled={aiEnabled}

      upgradeMessage={upgradeMessage}

      requiredPlanLabel={requiredPlanLabel}

    />

  );

}


