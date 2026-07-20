"use client";

import dynamic from "next/dynamic";

const loadingShell = (
  <div className="rounded-2xl border border-border bg-muted/5 p-8 text-sm text-muted">
    Loading workspace…
  </div>
);

export const KnowledgeHubWorkspaceLazy = dynamic(
  () =>
    import("@/components/knowledge/knowledge-hub-workspace").then(
      (mod) => mod.KnowledgeHubWorkspace,
    ),
  { loading: () => loadingShell },
);

export const PredictiveWorkspaceLazy = dynamic(
  () =>
    import("@/components/predictive/predictive-workspace").then(
      (mod) => mod.PredictiveWorkspace,
    ),
  { loading: () => loadingShell },
);

export const CopilotWorkspaceLazy = dynamic(
  () =>
    import("@/components/copilot/copilot-workspace").then((mod) => mod.CopilotWorkspace),
  { loading: () => loadingShell },
);

export const ComplianceWorkspaceLazy = dynamic(
  () =>
    import("@/components/compliance/compliance-workspace").then(
      (mod) => mod.ComplianceWorkspace,
    ),
  { loading: () => loadingShell },
);

export const WhiteLabelWorkspaceLazy = dynamic(
  () =>
    import("@/components/settings/white-label-workspace").then(
      (mod) => mod.WhiteLabelWorkspace,
    ),
  { loading: () => loadingShell },
);

export const ApiSettingsWorkspaceLazy = dynamic(
  () =>
    import("@/components/settings/api-settings-workspace").then(
      (mod) => mod.ApiSettingsWorkspace,
    ),
  { loading: () => loadingShell },
);

export const IntegrationCenterWorkspaceLazy = dynamic(
  () =>
    import("@/components/settings/integration-center-workspace").then(
      (mod) => mod.IntegrationCenterWorkspace,
    ),
  { loading: () => loadingShell },
);
