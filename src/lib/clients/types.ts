import type { Client, ClientStatus } from "@/types/database";

/** Client row without sensitive revenue — safe for Staff/Viewer. */
export type ClientWithoutRevenue = Omit<Client, "monthly_revenue">;

/** Client with optional revenue when the viewer may see it. */
export type ClientView = ClientWithoutRevenue & {
  monthly_revenue?: number | null;
};

export const CLIENT_STATUSES: ClientStatus[] = ["active", "watch", "critical", "archived"];

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  active: "Active",
  watch: "Watch",
  critical: "Critical",
  archived: "Archived",
};

const BASE_COLUMNS =
  "id, organization_id, name, status, contact_name, contact_email, notes, created_at, updated_at";

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
