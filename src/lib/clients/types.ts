import type { Client, ClientStatus } from "@/types/database";

/** Client row without sensitive revenue — safe for Staff/Viewer. */
export type ClientWithoutRevenue = Omit<Client, "monthly_revenue">;

/** Client with optional revenue when the viewer may see it. */
export type ClientView = ClientWithoutRevenue & {
  monthly_revenue?: number | null;
};

export type ClientOwner = {
  id: string;
  full_name: string;
};

export type ClientWithRelations = ClientView & {
  owner: ClientOwner | null;
};

export const CLIENT_STATUSES: ClientStatus[] = ["active", "watch", "critical", "archived"];

/** Statuses shown in list filters (excludes archived — use dedicated archived filter). */
export const CLIENT_LIST_STATUSES: ClientStatus[] = ["active", "watch", "critical"];

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  active: "Active",
  watch: "Watch",
  critical: "Critical",
  archived: "Archived",
};

const BASE_COLUMNS_V1 =
  "id, organization_id, name, status, contact_name, contact_email, notes, created_at, updated_at";

const BASE_COLUMNS_V2 =
  "id, organization_id, name, status, owner_id, health_score, sla_policy_id, contact_name, contact_email, notes, created_at, updated_at";

/** Preferred select — requires clients v2 columns (owner_id, health_score). */
export const CLIENT_SELECT_COLUMNS = BASE_COLUMNS_V2;
export const CLIENT_SELECT_COLUMNS_WITH_REVENUE = `${BASE_COLUMNS_V2}, monthly_revenue`;

/** Fallback when v2 migration has not been applied yet. */
export const CLIENT_SELECT_COLUMNS_V1 = BASE_COLUMNS_V1;
export const CLIENT_SELECT_COLUMNS_V1_WITH_REVENUE = `${BASE_COLUMNS_V1}, monthly_revenue`;

import type { AppCurrency } from "@/lib/i18n/currency";
import { formatWorkspaceMoney } from "@/lib/i18n/format";

export function formatClientRevenue(
  value: number | null | undefined,
  currency: AppCurrency,
): string {
  if (value == null) {
    return "—";
  }

  return formatWorkspaceMoney(value, currency);
}

export function formatClientDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatHealthScore(value: number | null | undefined): string {
  if (value == null) {
    return "—";
  }

  return String(value);
}

export function healthScoreTone(value: number | null | undefined): "healthy" | "watch" | "critical" | "muted" {
  if (value == null) {
    return "muted";
  }

  if (value >= 70) {
    return "healthy";
  }

  if (value >= 40) {
    return "watch";
  }

  return "critical";
}
