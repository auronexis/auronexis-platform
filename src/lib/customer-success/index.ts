export type {
  ClientSuccessHealthStatus,
  ClientSuccessTrend,
  ClientRecoveryStatus,
  ClientSuccessHealthBreakdown,
  ClientSuccessSignal,
  ClientSuccessRiskSignal,
  ClientSuccessSnapshot,
  CustomerSuccessPortfolio,
  CustomerSuccessPortfolioEntry,
  CustomerSuccessMetrics,
  CustomerSuccessTimelineEvent,
  CustomerSuccessActionResult,
  DashboardCustomerSuccessMode,
} from "@/lib/customer-success/types";

export {
  CLIENT_HEALTH_WEIGHTS,
  SUCCESS_PLAYBOOK_REGISTRY,
  getPlaybookDefinition,
} from "@/lib/customer-success/constants";

export {
  canReadCustomerSuccess,
  canWriteCustomerSuccess,
  canAssignCustomerSuccess,
  canCompleteCustomerSuccess,
  canManageCustomerSuccess,
} from "@/lib/customer-success/guards";

export {
  buildClientSuccessSnapshot,
  buildCustomerSuccessPortfolio,
  resolveDashboardCustomerSuccessMode,
  summarizeCustomerSuccessForDashboard,
} from "@/lib/customer-success/snapshot";

export { resolveSuggestedPlaybooks } from "@/lib/customer-success/playbook-engine";
export { buildClientSuccessTimeline } from "@/lib/customer-success/timeline";
export { computeClientHealth } from "@/lib/customer-success/health";

export {
  startPlaybookAction,
  pausePlaybookAction,
  resumePlaybookAction,
  completePlaybookAction,
  cancelPlaybookAction,
  assignPlaybookAction,
  completeTaskAction,
  skipTaskAction,
} from "@/lib/customer-success/actions";

export { buildCustomerSuccessAnalyticsProps } from "@/lib/customer-success/events";
