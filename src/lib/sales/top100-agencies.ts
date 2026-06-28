import type { AgencyType, LeadSourceRegion } from "@/types/database";

export type Top100AgencySeed = {
  company_name: string;
  contact_name: string;
  contact_email: string;
  source_region: LeadSourceRegion;
  agency_type: AgencyType;
  industry: string;
  location: string;
  employee_count: number;
  priority_score: number;
  pain_points: string;
  website: string;
};

type SegmentConfig = {
  region: LeadSourceRegion;
  agencyType: AgencyType;
  count: number;
  location: string;
  city: string;
  industry: string;
  namePrefix: string;
  painPoints: string;
};

const SEGMENTS: SegmentConfig[] = [
  {
    region: "dach",
    agencyType: "msp",
    count: 25,
    location: "Munich, DE",
    city: "Munich",
    industry: "Managed IT & GRC",
    namePrefix: "Alpine MSP",
    painPoints: "Multi-client compliance visibility and audit prep across DACH portfolios.",
  },
  {
    region: "dach",
    agencyType: "automation_agency",
    count: 25,
    location: "Zurich, CH",
    city: "Zurich",
    industry: "Workflow Automation",
    namePrefix: "Swiss Automation",
    painPoints: "Scaling automation delivery with provable client health metrics.",
  },
  {
    region: "dach",
    agencyType: "ai_agency",
    count: 25,
    location: "Vienna, AT",
    city: "Vienna",
    industry: "AI Services",
    namePrefix: "Danube AI",
    painPoints: "Operational risk monitoring for AI automation rollouts in regulated sectors.",
  },
  {
    region: "germany",
    agencyType: "agency",
    count: 25,
    location: "Berlin, DE",
    city: "Berlin",
    industry: "Digital GRC Agency",
    namePrefix: "Berlin GRC",
    painPoints: "Consolidating client governance signals into a single command center.",
  },
];

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildAgencySeed(segment: SegmentConfig, index: number): Top100AgencySeed {
  const num = String(index + 1).padStart(2, "0");
  const company_name = `${segment.namePrefix} ${num}`;
  const slug = slugify(company_name);
  const priority_score = 95 - index;

  return {
    company_name,
    contact_name: `Partner Lead ${num}`,
    contact_email: `growth+${slug}@example-agency.test`,
    source_region: segment.region,
    agency_type: segment.agencyType,
    industry: segment.industry,
    location: segment.location,
    employee_count: 12 + index * 3,
    priority_score,
    pain_points: segment.painPoints,
    website: `https://${slug}.example-agency.test`,
  };
}

export const TOP100_AGENCIES: Top100AgencySeed[] = SEGMENTS.flatMap((segment) =>
  Array.from({ length: segment.count }, (_, index) => buildAgencySeed(segment, index)),
);

export const TOP100_SEGMENT_SUMMARY = SEGMENTS.map((segment) => ({
  region: segment.region,
  agencyType: segment.agencyType,
  count: segment.count,
  label: `${segment.city} · ${segment.agencyType}`,
}));

export function countTop100ByRegion(): Record<LeadSourceRegion, number> {
  return TOP100_AGENCIES.reduce(
    (acc, agency) => {
      acc[agency.source_region] = (acc[agency.source_region] ?? 0) + 1;
      return acc;
    },
    { germany: 0, dach: 0, eu: 0 } as Record<LeadSourceRegion, number>,
  );
}

export function countTop100ByAgencyType(): Record<AgencyType, number> {
  return TOP100_AGENCIES.reduce(
    (acc, agency) => {
      acc[agency.agency_type] = (acc[agency.agency_type] ?? 0) + 1;
      return acc;
    },
    {
      msp: 0,
      ai_agency: 0,
      automation_agency: 0,
      agency: 0,
      consultant: 0,
    } as Record<AgencyType, number>,
  );
}
