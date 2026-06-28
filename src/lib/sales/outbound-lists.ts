import type { OutboundListType } from "@/types/database";

export const OUTBOUND_LIST_TYPES: Array<{
  key: OutboundListType;
  label: string;
  description: string;
}> = [
  { key: "prospects", label: "Prospects", description: "Individual decision-makers and champions." },
  { key: "companies", label: "Companies", description: "Target accounts by firmographic fit." },
  { key: "agencies", label: "Agencies", description: "Managed service and digital agencies." },
  { key: "msps", label: "MSPs", description: "Managed service providers with multi-client portfolios." },
  { key: "consultants", label: "Consultants", description: "Independent GRC and compliance consultants." },
  { key: "ai_agencies", label: "AI Agencies", description: "AI-native agencies building client automation." },
];

export function getOutboundListLabel(type: OutboundListType): string {
  return OUTBOUND_LIST_TYPES.find((item) => item.key === type)?.label ?? type;
}

export const DEFAULT_OUTBOUND_LISTS = OUTBOUND_LIST_TYPES.map((item) => ({
  name: item.label,
  list_type: item.key,
  description: item.description,
}));
