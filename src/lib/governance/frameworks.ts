import type { ComplianceFrameworkKey, GovernanceControlKey } from "@/lib/compliance/types";
import { FRAMEWORK_LABELS } from "@/lib/compliance/types";

export const GOVERNANCE_FRAMEWORKS: ComplianceFrameworkKey[] = [
  "soc2",
  "iso27001",
  "gdpr",
  "nis2",
  "dora",
  "hipaa",
];

export const GOVERNANCE_CONTROLS: Array<{ key: GovernanceControlKey; label: string }> = [
  { key: "identity", label: "Identity" },
  { key: "encryption", label: "Encryption" },
  { key: "logging", label: "Logging" },
  { key: "monitoring", label: "Monitoring" },
  { key: "backups", label: "Backups" },
  { key: "secrets", label: "Secrets" },
  { key: "retention", label: "Retention" },
  { key: "auditing", label: "Auditing" },
  { key: "incident_management", label: "Incident management" },
  { key: "access_control", label: "Access control" },
  { key: "api_security", label: "API security" },
  { key: "vendor_management", label: "Vendor management" },
  { key: "business_continuity", label: "Business continuity" },
  { key: "risk_management", label: "Risk management" },
  { key: "change_management", label: "Change management" },
  { key: "evidence_management", label: "Evidence management" },
];

export const FRAMEWORK_CONTROL_MAP: Record<ComplianceFrameworkKey, GovernanceControlKey[]> = {
  soc2: ["identity", "logging", "monitoring", "access_control", "change_management", "incident_management"],
  iso27001: ["identity", "encryption", "logging", "access_control", "risk_management", "business_continuity"],
  gdpr: ["retention", "auditing", "access_control", "evidence_management"],
  nis2: ["incident_management", "monitoring", "risk_management", "business_continuity"],
  dora: ["incident_management", "vendor_management", "business_continuity", "change_management"],
  hipaa: ["encryption", "access_control", "auditing", "retention"],
};

export function getFrameworkLabel(framework: ComplianceFrameworkKey): string {
  return FRAMEWORK_LABELS[framework];
}
