"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { loadDashboardOpsTab } from "@/app/(dashboard)/dashboard/ops-tab-actions";
import { OpsTabPanelSkeleton } from "@/components/dashboard/ops-tab-panel-skeleton";

type LazyOpsTabPanelProps = {
  tab: "intelligence" | "automation" | "governance";
  panelLabel: string;
};

/** Reuse a loaded tab for a minute so switching back and forth does not reload it. */
const REUSE_MS = 60_000;
const loaded = new Map<string, { node: ReactNode; at: number }>();

/**
 * Loads an Ops tab from the server the first time it is opened.
 * Mounted only while its tab is selected (see OperationsCenter).
 */
export function LazyOpsTabPanel({ tab, panelLabel }: LazyOpsTabPanelProps) {
  const [state, setState] = useState<
    { status: "loading" } | { status: "ready"; node: ReactNode } | { status: "error" }
  >(() => {
    const cached = loaded.get(tab);
    return cached && Date.now() - cached.at < REUSE_MS
      ? { status: "ready", node: cached.node }
      : { status: "loading" };
  });

  const load = useCallback(() => {
    let active = true;
    setState({ status: "loading" });
    loadDashboardOpsTab(tab)
      .then((node) => {
        loaded.set(tab, { node, at: Date.now() });
        if (active) setState({ status: "ready", node });
      })
      .catch(() => {
        if (active) setState({ status: "error" });
      });
    return () => {
      active = false;
    };
  }, [tab]);

  const needsLoad = state.status === "loading";
  useEffect(() => {
    if (!needsLoad) return;
    return load();
    // Load once per mount when nothing reusable is cached.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.status === "ready") {
    return <>{state.node}</>;
  }

  if (state.status === "error") {
    return (
      <div
        className="rounded-xl border border-border/70 bg-surface/60 px-4 py-6 text-sm text-muted"
        role="alert"
      >
        <p className="font-medium text-foreground">{panelLabel} could not be loaded.</p>
        <button
          type="button"
          onClick={() => load()}
          className="mt-2 font-medium text-foreground underline underline-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  return <OpsTabPanelSkeleton />;
}
