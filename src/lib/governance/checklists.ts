import type { ComplianceFrameworkKey } from "@/lib/compliance/types";
import { FRAMEWORK_LABELS } from "@/lib/compliance/types";
import { FRAMEWORK_CONTROL_MAP } from "@/lib/governance/frameworks";

export type ComplianceChecklistItem = {
  id: string;
  framework: ComplianceFrameworkKey;
  label: string;
  completed: boolean;
};

export function buildComplianceChecklist(
  framework: ComplianceFrameworkKey,
  completedControls: string[],
): ComplianceChecklistItem[] {
  return FRAMEWORK_CONTROL_MAP[framework].map((control) => ({
    id: `${framework}-${control}`,
    framework,
    label: `${FRAMEWORK_LABELS[framework]} — ${control.replace(/_/g, " ")}`,
    completed: completedControls.includes(control),
  }));
}

export function buildAllFrameworkChecklists(
  completedControls: string[],
): Record<ComplianceFrameworkKey, ComplianceChecklistItem[]> {
  return Object.keys(FRAMEWORK_CONTROL_MAP).reduce(
    (acc, framework) => {
      acc[framework as ComplianceFrameworkKey] = buildComplianceChecklist(
        framework as ComplianceFrameworkKey,
        completedControls,
      );
      return acc;
    },
    {} as Record<ComplianceFrameworkKey, ComplianceChecklistItem[]>,
  );
}
