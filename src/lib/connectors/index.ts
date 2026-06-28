import { bootstrapConnectors } from "@/lib/connectors/bootstrap";

bootstrapConnectors();

export { bootstrapConnectors, ALL_CONNECTOR_CONFIGS } from "@/lib/connectors/bootstrap";
export {
  getConnectorDefinition,
  getConnectorCount,
  isConnectorRegistered,
  listConnectorDefinitions,
} from "@/lib/connectors/registry";
export type {
  ConnectorConnectionView,
  ConnectorDefinition,
  ConnectorDiagnosticsRow,
  ConnectorHealthResult,
  ConnectorId,
  ConnectorSyncJobView,
  ConnectorsDashboardSnapshot,
  ConnectorsDiagnosticsSnapshot,
} from "@/lib/connectors/types";
export { CONNECTOR_PLATFORM_VERSION } from "@/lib/connectors/types";
export {
  getConnectorsDashboardSnapshot,
  getConnectorConnectionByConnectorId,
  getConnectorConfig,
  listConnectorConnections,
} from "@/lib/connectors/queries";
export { getConnectorsDiagnosticsSnapshot } from "@/lib/connectors/health";
export {
  revokeConnectorConnectionAction,
  runConnectorSyncAction,
} from "@/lib/connectors/actions";
export { runConnectorSync, scheduleConnectorSync } from "@/lib/connectors/sync";
