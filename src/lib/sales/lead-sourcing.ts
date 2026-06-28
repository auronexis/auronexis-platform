import type { AgencyType, LeadSourceRegion } from "@/types/database";

export const LEAD_SOURCE_REGIONS: Array<{
  key: LeadSourceRegion;
  label: string;
  description: string;
}> = [
  { key: "germany", label: "Germany", description: "Top agencies headquartered in Germany." },
  { key: "dach", label: "DACH", description: "Germany, Austria, and Switzerland targets." },
  { key: "eu", label: "EU", description: "Broader European agency market." },
];

export const AGENCY_TYPES: Array<{
  key: AgencyType;
  label: string;
  description: string;
}> = [
  { key: "msp", label: "MSP", description: "Managed service providers with multi-client portfolios." },
  { key: "ai_agency", label: "AI Agency", description: "AI-native agencies serving regulated clients." },
  {
    key: "automation_agency",
    label: "Automation Agency",
    description: "Workflow and automation consultancies.",
  },
  { key: "agency", label: "Agency", description: "General digital and GRC agencies." },
  { key: "consultant", label: "Consultant", description: "Independent compliance consultants." },
];

export const TOP_100_AGENCY_CRITERIA = [
  "10–200 employees",
  "5+ managed clients",
  "GRC or compliance services",
  "DACH or EU headquarters",
  "Decision-maker identified",
  "Website and LinkedIn verified",
  "Pain points documented",
  "Priority score ≥ 60",
] as const;

export const TOP_100_TARGET = 100;

export function getRegionLabel(region: LeadSourceRegion): string {
  return LEAD_SOURCE_REGIONS.find((item) => item.key === region)?.label ?? region;
}

export function getAgencyTypeLabel(type: AgencyType): string {
  return AGENCY_TYPES.find((item) => item.key === type)?.label ?? type;
}
