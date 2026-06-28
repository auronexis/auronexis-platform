import type { PlanKey } from "@/lib/billing/plans";

export type OrganizationSeatUsage = {
  organizationId: string;
  limit: number;
  used: number;
  activeUsers: number;
  pendingInvitations: number;
  isOverLimit: boolean;
  isAtLimit: boolean;
  planKey: PlanKey | null;
};

export type SeatInviteCheckResult =
  | { allowed: true }
  | { allowed: false; message: string };

export type SeatPlanBlockReason = {
  blocked: boolean;
  message: string | null;
};
