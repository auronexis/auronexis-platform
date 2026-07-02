import type { PlanKey } from "@/lib/billing/plans";
import type { PlanFeatures } from "@/lib/plans/types";

export type EnterpriseRequestStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "approved"
  | "rejected"
  | "closed";

export type PlanOverrideStatus = "active" | "inactive" | "expired" | "revoked";

export type EnterpriseRequestView = {
  id: string;
  organizationId: string;
  requestedBy: string | null;
  contactEmail: string | null;
  companyName: string | null;
  requestedSeats: number | null;
  requestedClients: number | null;
  requestedFeatures: string[];
  notes: string | null;
  status: EnterpriseRequestStatus;
  handledBy: string | null;
  handledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationPlanOverrideView = {
  id: string;
  organizationId: string;
  plan: PlanKey;
  status: PlanOverrideStatus;
  seatsLimit: number | null;
  clientsLimit: number | null;
  monitoringLimit: number | null;
  apiEnabled: boolean;
  webhooksEnabled: boolean;
  aiEnabled: boolean;
  portalBrandingEnabled: boolean;
  customDomainEnabled: boolean;
  prioritySupportEnabled: boolean;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EffectiveLimits = {
  seats: number;
  maxClients: number | null;
  monitoringLimit: number | null;
};

export type EnterpriseStatus = {
  hasActiveOverride: boolean;
  override: OrganizationPlanOverrideView | null;
  latestRequest: EnterpriseRequestView | null;
  isEnterpriseActive: boolean;
  apiEnabled: boolean;
  webhooksEnabled: boolean;
  aiEnabled: boolean;
  prioritySupportEnabled: boolean;
  portalBrandingEnabled: boolean;
  customDomainEnabled: boolean;
};

export type CreateEnterpriseRequestInput = {
  contactEmail?: string | null;
  companyName?: string | null;
  requestedSeats?: number | null;
  requestedClients?: number | null;
  requestedFeatures?: string[];
  notes?: string | null;
};

export type PlanOverrideInput = {
  organizationId: string;
  plan: PlanKey;
  status?: PlanOverrideStatus;
  seatsLimit?: number | null;
  clientsLimit?: number | null;
  monitoringLimit?: number | null;
  apiEnabled?: boolean;
  webhooksEnabled?: boolean;
  aiEnabled?: boolean;
  portalBrandingEnabled?: boolean;
  customDomainEnabled?: boolean;
  prioritySupportEnabled?: boolean;
  notes?: string | null;
  createdBy?: string | null;
};

export type MergedPlanFeatures = PlanFeatures & {
  monitoring_limit: number | null;
  portal_branding_enabled: boolean;
  custom_domain_enabled: boolean;
};
