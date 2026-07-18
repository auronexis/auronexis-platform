import type { PlanKey } from "@/lib/billing/plans";
import type { AIUsageSummary } from "@/lib/ai/types";
import type { OrganizationPlanContext, PlanFeatureKey, PlanResolutionSource } from "@/lib/plans/types";
import type { OrganizationSubscription } from "@/types/database";
import type { UserRole } from "@/types/database";

export type EnvVarStatus = {
  name: string;
  present: boolean;
  preview?: string;
};

export type PlatformEnvDiagnostics = import("@/lib/diagnostics/platform-env").PlatformEnvDiagnostics;

export type SubscriptionDiagnostics = {
  exists: boolean;
  row: OrganizationSubscription | null;
  missingMessage: string | null;
};

export type LockedFeatureInfo = {
  feature: PlanFeatureKey;
  label: string;
  requiredPlan: PlanKey;
  requiredPlanLabel: string;
};

export type PermissionDiagnostics = {
  canAccessSettings: boolean;
  canCreateReport: boolean;
  canUseAiReportAssistant: boolean;
  canUseReportTemplates: boolean;
  canUseReportSchedules: boolean;
  canUseEmailDelivery: boolean;
  canUseRisks: boolean;
  canUseIncidents: boolean;
  canUseProfitability: boolean;
  canUseWhiteLabel: boolean;
  canUseNotifications: boolean;
};

export type AIReadinessDiagnostics = {
  aiProviderEnv: string;
  openaiApiKeyPresent: boolean;
  openaiModel: string;
  resolvedProviderId: string;
  aiFeatureAllowed: boolean;
  usageSummary: AIUsageSummary;
  diagnostics: import("@/lib/ai/core/observability").AIDiagnosticsSnapshot;
};

export type PlatformDiagnostics = {
  buildVersion: string;
  environment: string;
  nodeEnv: string;
  deploymentUrl: string | null;
  databaseHealth: import("@/lib/diagnostics/platform-health").HealthCheckResult;
  stripeHealth: import("@/lib/diagnostics/platform-health").HealthCheckResult;
  cacheEnabled: boolean;
  planSource: PlanResolutionSource;
  developerMode: boolean;
};

export type AutomationDiagnostics = {
  workflowCount: number;
  executionCount: number;
  draftCount: number;
  versionCount: number;
  webhookCount: number;
  storageBackend: "supabase";
  migrationStatus: "not_needed" | "pending" | "complete";
  localStorageMigratedAt: string | null;
  repositoryStatus: "healthy" | "degraded" | "unavailable";
  databaseLatencyMs: number | null;
  engine: import("@/lib/automation/storage/types").AutomationEngineDiagnosticsSnapshot;
};

export type IntegrationsDiagnostics = import("@/lib/integrations/types").IntegrationDiagnosticsSnapshot;

export type SecretsDiagnostics =
  import("@/lib/integrations/secrets/types").IntegrationSecretsDiagnosticsSnapshot;

export type IntegrationRuntimeDiagnostics =
  import("@/lib/integrations/types").IntegrationRuntimeDiagnosticsSnapshot;

export type PredictiveDiagnostics =
  import("@/lib/predictive/types").PredictiveDiagnosticsSnapshot;

export type ConnectorsDiagnostics = import("@/lib/connectors/types").ConnectorsDiagnosticsSnapshot;

export type PublicApiDiagnostics = import("@/lib/api/types").ApiDiagnosticsSnapshot;

export type WhiteLabelDiagnostics = import("@/lib/white-label/types").WhiteLabelDiagnosticsSnapshot;

export type BillingPlatformDiagnostics =
  import("@/lib/billing/types").BillingDiagnosticsSnapshot;

export type CompliancePlatformDiagnostics =
  import("@/lib/compliance/types").ComplianceDiagnosticsSnapshot;

export type StripeWebhookDiagnostics =
  import("@/lib/diagnostics/webhook-archive").StripeWebhookDiagnostics;

export type CronInfrastructureDiagnostics =
  import("@/lib/jobs/types").CronDiagnosticsSnapshot;

export type QueueInfrastructureDiagnostics =
  import("@/lib/jobs/types").QueueDiagnosticsSnapshot;

export type ProductionReadinessDiagnostics =
  import("@/lib/jobs/types").ProductionReadinessSnapshot;

export type LaunchPolishDiagnostics = import("@/lib/diagnostics/launch-polish").LaunchPolishSnapshot;

export type PilotAcquisitionDiagnostics =
  import("@/lib/diagnostics/pilot-acquisition").PilotAcquisitionSnapshot;

export type DeploymentReadinessDiagnostics =
  import("@/lib/diagnostics/deployment-readiness").DeploymentReadinessSnapshot;

export type PilotExecutionReadinessDiagnostics =
  import("@/lib/diagnostics/pilot-execution-readiness").PilotExecutionReadinessSnapshot;

export type GoLiveReadinessDiagnostics =
  import("@/lib/diagnostics/go-live-readiness").GoLiveReadinessSnapshot;

export type SecurityReadinessDiagnostics =
  import("@/lib/diagnostics/security-readiness").SecurityReadinessSnapshot;

export type AbuseProtectionDiagnostics =
  import("@/lib/diagnostics/abuse-protection").AbuseProtectionSnapshot;

export type RevenueReadinessDiagnostics =
  import("@/lib/diagnostics/revenue-readiness").RevenueReadinessSnapshot;

export type AcquisitionReadinessDiagnostics =
  import("@/lib/diagnostics/acquisition-readiness").AcquisitionReadinessSnapshot;

export type FirstCustomerReadinessDiagnostics =
  import("@/lib/diagnostics/first-customer-readiness").FirstCustomerReadinessSnapshot;

export type LaunchCandidateReadinessDiagnostics =
  import("@/lib/diagnostics/launch-candidate-readiness").LaunchCandidateReadinessSnapshot;

export type WorkspaceDiagnostics = {
  organization: {
    name: string;
    organizationId: string;
    slug: string | null;
    userId: string;
    userRole: UserRole;
    userEmail: string;
  };
  plan: OrganizationPlanContext;
  enabledFeatures: Array<{ key: PlanFeatureKey; enabled: boolean }>;
  lockedFeatures: LockedFeatureInfo[];
  subscription: SubscriptionDiagnostics;
  platformEnv: PlatformEnvDiagnostics;
  matchedPlanFromSubscriptionPriceId: PlanKey | null;
  ai: AIReadinessDiagnostics;
  automation: AutomationDiagnostics;
  integrations: IntegrationsDiagnostics;
  integrationRuntime: IntegrationRuntimeDiagnostics;
  predictive: PredictiveDiagnostics;
  connectors: ConnectorsDiagnostics;
  publicApi: PublicApiDiagnostics;
  whiteLabel: WhiteLabelDiagnostics;
  billing: BillingPlatformDiagnostics;
  compliance: CompliancePlatformDiagnostics;
  secrets: SecretsDiagnostics;
  stripeWebhook: StripeWebhookDiagnostics;
  cron: CronInfrastructureDiagnostics;
  queue: QueueInfrastructureDiagnostics;
  productionReadiness: ProductionReadinessDiagnostics;
  launchPolish: LaunchPolishDiagnostics;
  pilotAcquisition: PilotAcquisitionDiagnostics;
  deploymentReadiness: DeploymentReadinessDiagnostics;
  pilotExecution: PilotExecutionReadinessDiagnostics;
  goLive: GoLiveReadinessDiagnostics;
  securityReadiness: SecurityReadinessDiagnostics;
  abuseProtection: AbuseProtectionDiagnostics;
  revenueReadiness: RevenueReadinessDiagnostics;
  acquisitionReadiness: AcquisitionReadinessDiagnostics;
  firstCustomerReadiness: FirstCustomerReadinessDiagnostics;
  launchCandidateReadiness: LaunchCandidateReadinessDiagnostics;
  platform: PlatformDiagnostics;
  permissions: PermissionDiagnostics;
  devForcePlanEnvPresent: boolean;
  devForcePlanValue: string | null;
  isDevelopment: boolean;
};
