"use client";

import { Component, type ReactNode } from "react";

type OpsTabPanelErrorBoundaryProps = {
  children: ReactNode;
  panelLabel: string;
};

type OpsTabPanelErrorBoundaryState = {
  hasError: boolean;
};

/**
 * Isolates Ops tab Suspense panels so one hub failure does not blank the dashboard.
 */
export class OpsTabPanelErrorBoundary extends Component<
  OpsTabPanelErrorBoundaryProps,
  OpsTabPanelErrorBoundaryState
> {
  state: OpsTabPanelErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): OpsTabPanelErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="rounded-xl border border-border/70 bg-surface/60 px-4 py-6 text-sm text-muted"
          role="alert"
        >
          <p className="font-medium text-foreground">
            {this.props.panelLabel} could not be loaded.
          </p>
          <p className="mt-1">Refresh the page to try again.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
