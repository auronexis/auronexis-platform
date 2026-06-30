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

const BASE_COLUMNS =
  "id, organization_id, name, status, owner_id, health_score, contact_name, contact_email, notes, created_at, updated_at";

export const CLIENT_SELECT_COLUMNS = BASE_COLUMNS;
export const CLIENT_SELECT_COLUMNS_WITH_REVENUE = `${BASE_COLUMNS}, monthly_revenue`;

export function formatClientRevenue(value: number | null | undefined): string {
  if (value == null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
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
