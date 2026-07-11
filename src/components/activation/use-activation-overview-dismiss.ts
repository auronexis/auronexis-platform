"use client";

import { useCallback, useState } from "react";
import {
  dismissActivationPanelAction,
  restoreActivationPanelAction,
} from "@/lib/activation/actions";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import type { ActivationStage } from "@/lib/activation/types";

type ActivationOverviewSourceRoute = "/dashboard" | "/onboarding";

type UseActivationOverviewDismissOptions = {
  canDismiss: boolean;
  serverDismissed: boolean;
  stage: ActivationStage;
  completionPercent: number;
  sourceRoute: ActivationOverviewSourceRoute;
};

export function useActivationOverviewDismiss({
  canDismiss,
  serverDismissed,
  stage,
  completionPercent,
  sourceRoute,
}: UseActivationOverviewDismissOptions) {
  const [optimisticDismissed, setOptimisticDismissed] = useState(false);
  const [optimisticRestored, setOptimisticRestored] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDismissed = (optimisticDismissed || serverDismissed) && !optimisticRestored;

  const handleDismiss = useCallback(async () => {
    if (!canDismiss || pending || isDismissed) {
      return;
    }

    setOptimisticDismissed(true);
    setOptimisticRestored(false);
    setPending(true);
    setError(null);

    trackAnalyticsEvent("activation_panel_dismissed", {
      activation_stage: stage,
      completion_percentage: completionPercent,
      source_route: sourceRoute,
    });

    try {
      const result = await dismissActivationPanelAction();
      if (result.error) {
        setOptimisticDismissed(false);
        setError(result.error);
      }
    } catch {
      setOptimisticDismissed(false);
      setError("Unable to dismiss the activation overview. Please try again.");
    } finally {
      setPending(false);
    }
  }, [canDismiss, pending, isDismissed, stage, completionPercent, sourceRoute]);

  const handleRestore = useCallback(async () => {
    if (!canDismiss || pending || !isDismissed) {
      return;
    }

    setOptimisticRestored(true);
    setOptimisticDismissed(false);
    setPending(true);
    setError(null);

    try {
      const result = await restoreActivationPanelAction();
      if (result.error) {
        setOptimisticRestored(false);
        setError(result.error);
      }
    } catch {
      setOptimisticRestored(false);
      setError("Unable to restore the activation overview. Please try again.");
    } finally {
      setPending(false);
    }
  }, [canDismiss, pending, isDismissed]);

  return {
    isDismissed,
    pending,
    error,
    handleDismiss,
    handleRestore,
  };
}
