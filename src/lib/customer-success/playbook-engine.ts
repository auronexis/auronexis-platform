import {
  getPlaybookDefinition,
  MAX_SUGGESTED_PLAYBOOKS,
  SUCCESS_PLAYBOOK_REGISTRY,
} from "@/lib/customer-success/constants";
import { hasPlaybookPermission } from "@/lib/customer-success/guards";
import type {
  ClientSuccessRiskSignal,
  ClientSuccessSignal,
  SuggestedSuccessPlaybook,
  SuccessPriority,
} from "@/lib/customer-success/types";
import type { SessionContext } from "@/lib/tenancy/context";
import { isFeatureEnabled } from "@/lib/plans/features";
import type { PlanKey } from "@/lib/billing/plans";

const PRIORITY_RANK: Record<SuccessPriority, number> = {
  urgent: 100,
  high: 80,
  medium: 50,
  low: 20,
};

type SuggestInput = {
  session: SessionContext;
  planKey: PlanKey;
  riskSignals: ClientSuccessRiskSignal[];
  adoptionSignals: ClientSuccessSignal[];
  activePlaybookKeys: string[];
};

function isFeatureAvailable(requiredFeatures: string[], planKey: PlanKey): boolean {
  if (requiredFeatures.length === 0) return true;
  return requiredFeatures.every((f) =>
    isFeatureEnabled(planKey, f as Parameters<typeof isFeatureEnabled>[1]),
  );
}

export function resolveSuggestedPlaybooks(input: SuggestInput): SuggestedSuccessPlaybook[] {
  const triggerCodes = new Set([
    ...input.riskSignals.map((s) => s.code),
    ...input.adoptionSignals.map((s) => s.code),
  ]);

  const suggestions: SuggestedSuccessPlaybook[] = [];

  for (const playbook of SUCCESS_PLAYBOOK_REGISTRY) {
    if (input.activePlaybookKeys.includes(playbook.key)) continue;

    const matched = playbook.triggerCodes.some((code) => triggerCodes.has(code));
    if (!matched) continue;

    const available = isFeatureAvailable(playbook.requiredFeatures, input.planKey);
    const permitted = hasPlaybookPermission(input.session, playbook.requiredPermissions);
    const matchedSignal =
      input.riskSignals.find((s) => playbook.triggerCodes.includes(s.code)) ??
      input.adoptionSignals.find((s) => playbook.triggerCodes.includes(s.code));

    suggestions.push({
      key: playbook.key,
      name: playbook.name,
      description: playbook.description,
      priority: playbook.defaultPriority,
      reason: matchedSignal?.description ?? playbook.description,
      available,
      permitted,
    });
  }

  return suggestions
    .sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority])
    .slice(0, MAX_SUGGESTED_PLAYBOOKS);
}

export function getPlaybookName(key: string): string {
  return getPlaybookDefinition(key)?.name ?? key;
}
