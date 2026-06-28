export { executeAutomationAction } from "./actions";
export { dispatchAutomation, runAutomation } from "./engine";
export { resolveAutomationActions } from "./triggers";
export {
  AUTOMATION_ENGINE_LABEL,
  AUTOMATION_FOOTER,
  calculateAutomationClientHealth,
  isCriticalOpenIncident,
  isCriticalOpenRisk,
} from "./types";
export type {
  AutomationActionResult,
  AutomationActionType,
  AutomationEvent,
  AutomationEventPayload,
  AutomationRunResult,
  AutomationTrigger,
} from "./types";
